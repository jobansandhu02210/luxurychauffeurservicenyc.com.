/**
 * Eagle Eye Chauffeur - Booking Page
 * Point to Point, Hourly, Airport Transfer with address autofill and fleet-based pricing.
 *
 * For address autocomplete: Get a Google Places API key at https://console.cloud.google.com/
 * Enable "Places API" and "Geocoding API", then set GOOGLE_PLACES_API_KEY below.
 */
(function () {
    'use strict';

    // --- CONFIG: Google Places API key for address autocomplete ---
    var GOOGLE_PLACES_API_KEY = 'AIzaSyAWPq6MBuO1Nk_eR5er8Ngm5cZzXe1gTZM';

    // --- Fleet pricing (USD): per-mile and derived ---
    var FLEET_NAMES = {
        business_sedan: 'Business Sedan (Mercedes E-Class)',
        business_suv: 'Business SUV (Chevrolet Suburban)',
        first_class_suv: 'First Class SUV (Cadillac Escalade)',
        first_class_sedan: 'First Class Sedan (Mercedes S-Class)'
    };

    var PRICING = {
        pointToPoint: {
            business_sedan:    { perMile: 8 },
            business_suv:      { perMile: 10 },
            first_class_suv:   { perMile: 12 },
            first_class_sedan: { perMile: 16 }
        },
        hourly: {
            business_sedan:    { perHour: 75, minHours: 3 },
            business_suv:      { perHour: 95, minHours: 3 },
            first_class_suv:   { perHour: 110, minHours: 3 },
            first_class_sedan: { perHour: 125, minHours: 3 }
        },
        airport: {
            JFK:  { business_sedan: 120, business_suv: 150, first_class_suv: 180, first_class_sedan: 240 },
            LGA:  { business_sedan: 96,  business_suv: 120, first_class_suv: 144, first_class_sedan: 192 },
            EWR:  { business_sedan: 136, business_suv: 170, first_class_suv: 204, first_class_sedan: 272 },
            TEB:  { business_sedan: 128, business_suv: 160, first_class_suv: 192, first_class_sedan: 256 },
            HPN:  { business_sedan: 176, business_suv: 220, first_class_suv: 264, first_class_sedan: 352 }
        }
    };

    var AIRPORT_COORDS = {
        JFK: { lat: 40.6413, lng: -73.7781 },
        LGA: { lat: 40.7769, lng: -73.8740 },
        EWR: { lat: 40.6895, lng: -74.1745 },
        TEB: { lat: 40.8501, lng: -74.0608 },
        HPN: { lat: 41.0670, lng: -73.7076 }
    };

    var DRIVING_DISTANCE_FACTOR = 1.35;

    // --- State ---
    var currentTab = 'point-to-point';
    var pickupLatLng = null;
    var dropoffLatLng = null;
    var hourlyPickupLatLng = null;
    var airportAddressLatLng = null;

    // --- DOM ---
    var form = document.getElementById('booking-form');
    var tabs = document.querySelectorAll('.booking-tab');
    var panels = document.querySelectorAll('.booking-panel');
    var fleetInputs = document.querySelectorAll('input[name="fleet"]');
    var summaryService = document.getElementById('summary-service');
    var summaryVehicle = document.getElementById('summary-vehicle');
    var summaryMilesRow = document.getElementById('summary-miles-row');
    var summaryMiles = document.getElementById('summary-miles');
    var summaryDurationRow = document.getElementById('summary-duration-row');
    var summaryDuration = document.getElementById('summary-duration');
    var summaryTotal = document.getElementById('summary-total');

    function getFleet() {
        var checked = document.querySelector('input[name="fleet"]:checked');
        return checked ? checked.value : 'business_sedan';
    }

    function haversineMiles(lat1, lng1, lat2, lng2) {
        var R = 3959;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLng = (lng2 - lng1) * Math.PI / 180;
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function drivingMiles(straightMiles) {
        return Math.max(0, straightMiles * DRIVING_DISTANCE_FACTOR);
    }

    function roundMiles(m) {
        return Math.round(m * 10) / 10;
    }

    function calcPointToPointPrice(miles, fleet) {
        var p = PRICING.pointToPoint[fleet];
        if (!p) return 0;
        return Math.round(miles * p.perMile);
    }

    function calcHourlyPrice(hours, fleet) {
        var p = PRICING.hourly[fleet];
        if (!p) return 0;
        var h = Math.max(p.minHours, parseInt(hours, 10) || p.minHours);
        return h * p.perHour;
    }

    function calcAirportPrice(airport, fleet) {
        var rates = PRICING.airport[airport];
        if (!rates) return 0;
        return rates[fleet] || rates.sedan;
    }

    function updateSummary() {
        var fleet = getFleet();
        summaryVehicle.textContent = FLEET_NAMES[fleet] || fleet;

        if (currentTab === 'point-to-point') {
            summaryService.textContent = 'Point to Point';
            summaryMilesRow.style.display = '';
            summaryDurationRow.style.display = 'none';
            if (pickupLatLng && dropoffLatLng) {
                var straight = haversineMiles(
                    pickupLatLng.lat, pickupLatLng.lng,
                    dropoffLatLng.lat, dropoffLatLng.lng
                );
                var miles = drivingMiles(straight);
                summaryMiles.textContent = roundMiles(miles) + ' mi';
                var total = calcPointToPointPrice(miles, fleet);
                summaryTotal.textContent = '$' + total;
            } else {
                summaryMiles.textContent = '—';
                summaryTotal.textContent = '$—';
            }
        } else if (currentTab === 'hourly') {
            summaryService.textContent = 'Hourly';
            summaryMilesRow.style.display = 'none';
            summaryDurationRow.style.display = '';
            var durationSelect = document.getElementById('hourly-duration');
            var hours = durationSelect ? parseInt(durationSelect.value, 10) : 3;
            summaryDuration.textContent = hours + ' hr' + (hours > 1 ? 's' : '');
            var total = calcHourlyPrice(hours, fleet);
            summaryTotal.textContent = '$' + total;
        } else {
            summaryService.textContent = 'Airport Transfer';
            summaryMilesRow.style.display = 'none';
            summaryDurationRow.style.display = 'none';
            var airportSelect = document.getElementById('airport-select');
            var airport = airportSelect ? airportSelect.value : 'JFK';
            var total = calcAirportPrice(airport, fleet);
            summaryTotal.textContent = '$' + total;
        }
    }

    function switchTab(tabId) {
        currentTab = tabId;
        tabs.forEach(function (t) {
            var isActive = t.getAttribute('data-tab') === tabId;
            t.classList.toggle('active', isActive);
            t.setAttribute('aria-selected', isActive);
        });
        panels.forEach(function (p) {
            var panelId = 'panel-' + tabId;
            p.classList.toggle('active', p.id === panelId);
        });
        updateSummary();
    }

    function initTabs() {
        tabs.forEach(function (t) {
            t.addEventListener('click', function () {
                switchTab(t.getAttribute('data-tab'));
            });
        });
        fleetInputs.forEach(function (f) {
            f.addEventListener('change', updateSummary);
        });
        var hourlyDuration = document.getElementById('hourly-duration');
        if (hourlyDuration) hourlyDuration.addEventListener('change', updateSummary);
        var airportSelect = document.getElementById('airport-select');
        if (airportSelect) airportSelect.addEventListener('change', updateSummary);
    }

    function initPlacesAutocomplete() {
        if (!GOOGLE_PLACES_API_KEY) return;
        var script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_PLACES_API_KEY + '&libraries=places';
        script.async = true;
        script.defer = true;
        script.onload = function () {
            if (typeof google === 'undefined' || !google.maps || !google.maps.places) return;
            var options = {
                types: ['address'],
                componentRestrictions: { country: 'us' },
                fields: ['formatted_address', 'geometry']
            };
            var inputIds = ['pickup-address', 'dropoff-address', 'hourly-pickup', 'airport-other-address'];
            inputIds.forEach(function (inputId) {
                var input = document.getElementById(inputId);
                if (!input) return;
                var autocomplete = new google.maps.places.Autocomplete(input, options);
                autocomplete.addListener('place_changed', function () {
                    var place = autocomplete.getPlace();
                    if (!place.geometry || !place.geometry.location) return;
                    var lat = place.geometry.location.lat();
                    var lng = place.geometry.location.lng();
                    if (inputId === 'pickup-address') {
                        pickupLatLng = { lat: lat, lng: lng };
                        var h = document.getElementById('pickup-lat');
                        var h2 = document.getElementById('pickup-lng');
                        if (h) h.value = lat;
                        if (h2) h2.value = lng;
                    } else if (inputId === 'dropoff-address') {
                        dropoffLatLng = { lat: lat, lng: lng };
                        var h = document.getElementById('dropoff-lat');
                        var h2 = document.getElementById('dropoff-lng');
                        if (h) h.value = lat;
                        if (h2) h2.value = lng;
                    } else if (inputId === 'hourly-pickup') {
                        hourlyPickupLatLng = { lat: lat, lng: lng };
                        var h = document.getElementById('hourly-pickup-lat');
                        var h2 = document.getElementById('hourly-pickup-lng');
                        if (h) h.value = lat;
                        if (h2) h2.value = lng;
                    } else if (inputId === 'airport-other-address') {
                        airportAddressLatLng = { lat: lat, lng: lng };
                    }
                    updateSummary();
                });
            });
        };
        document.head.appendChild(script);
    }

    function getPointToPointMiles() {
        if (!pickupLatLng || !dropoffLatLng) return null;
        var straight = haversineMiles(
            pickupLatLng.lat, pickupLatLng.lng,
            dropoffLatLng.lat, dropoffLatLng.lng
        );
        return drivingMiles(straight);
    }

    function setMinDate() {
        var dateInput = document.getElementById('trip-date');
        if (!dateInput) return;
        var today = new Date();
        var y = today.getFullYear();
        var m = String(today.getMonth() + 1).padStart(2, '0');
        var d = String(today.getDate()).padStart(2, '0');
        dateInput.setAttribute('min', y + '-' + m + '-' + d);
    }

    function geocodeWithNominatim(address, callback) {
        var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address) + '&limit=1';
        fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'EagleEyeChauffeur-Booking/1.0' } })
            .then(function (r) { return r.json(); })
            .then(function (results) {
                if (!results || !results[0]) { callback(null); return; }
                var lat = parseFloat(results[0].lat);
                var lng = parseFloat(results[0].lon);
                callback({ lat: lat, lng: lng });
            })
            .catch(function () { callback(null); });
    }

    function setLatLngForInput(inputId, lat, lng) {
        if (inputId === 'pickup-address') {
            pickupLatLng = { lat: lat, lng: lng };
            var h = document.getElementById('pickup-lat');
            var h2 = document.getElementById('pickup-lng');
            if (h) h.value = lat;
            if (h2) h2.value = lng;
        } else if (inputId === 'dropoff-address') {
            dropoffLatLng = { lat: lat, lng: lng };
            var h = document.getElementById('dropoff-lat');
            var h2 = document.getElementById('dropoff-lng');
            if (h) h.value = lat;
            if (h2) h2.value = lng;
        } else if (inputId === 'hourly-pickup') {
            hourlyPickupLatLng = { lat: lat, lng: lng };
            var h = document.getElementById('hourly-pickup-lat');
            var h2 = document.getElementById('hourly-pickup-lng');
            if (h) h.value = lat;
            if (h2) h2.value = lng;
        } else if (inputId === 'airport-other-address') {
            airportAddressLatLng = { lat: lat, lng: lng };
        }
        updateSummary();
    }

    function handleManualAddress(inputId) {
        var input = document.getElementById(inputId);
        if (!input) return;
        input.addEventListener('blur', function () {
            var val = (input.value || '').trim();
            if (!val || val.length < 5) return;
            if (typeof google !== 'undefined' && google.maps && google.maps.Geocoder) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address: val }, function (results, status) {
                    if (status !== 'OK' || !results || !results[0] || !results[0].geometry) return;
                    var loc = results[0].geometry.location;
                    setLatLngForInput(inputId, loc.lat(), loc.lng());
                });
            } else {
                geocodeWithNominatim(val, function (coords) {
                    if (coords) setLatLngForInput(inputId, coords.lat, coords.lng);
                });
            }
        });
    }

    function showConfirmation(date, time, totalText) {
        var section = document.getElementById('booking-section');
        var confirmation = document.getElementById('booking-confirmation');
        var detailsEl = document.getElementById('confirmation-details');
        if (!confirmation || !detailsEl) return;
        detailsEl.innerHTML =
            '<p><strong>Service:</strong> ' + (summaryService ? summaryService.textContent : currentTab) + '</p>' +
            '<p><strong>Vehicle:</strong> ' + (summaryVehicle ? summaryVehicle.textContent : getFleet()) + '</p>' +
            '<p><strong>Estimated total:</strong> ' + totalText + '</p>' +
            '<p><strong>Date & time:</strong> ' + date + ' at ' + time + '</p>';
        if (section) section.style.display = 'none';
        confirmation.hidden = false;
        confirmation.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        var fleet = getFleet();
        var name = document.getElementById('book-name').value.trim();
        var phone = document.getElementById('book-phone').value.trim();
        var email = document.getElementById('book-email').value.trim();
        if (!name || !phone || !email) {
            showFieldError('book-name', 'Please enter your full name, phone, and email.');
            return;
        }
        var date = document.getElementById('trip-date').value;
        var time = document.getElementById('trip-time').value;
        if (!date || !time) {
            showFieldError('trip-date', 'Please select date and time.');
            return;
        }
        var totalEl = document.getElementById('summary-total');
        var totalText = totalEl ? totalEl.textContent : '';
        if (totalText === '$—' || totalText === '$0') {
            showFieldError('pickup-address', 'Please complete trip details (pickup and drop-off or airport) so we can show your quote. You can also call us to book.');
            return;
        }

        var submitBtn = document.getElementById('submit-booking');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').textContent = 'Sending...';
        }

        var formData = new FormData(form);
        formData.set('service_type', currentTab);
        formData.set('estimated_total', totalText);
        formData.set('vehicle', summaryVehicle ? summaryVehicle.textContent : FLEET_NAMES[fleet]);

        fetch('send-booking.php', {
            method: 'POST',
            body: formData
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success) {
                showConfirmation(date, time, totalText);
                form.reset();
                pickupLatLng = null;
                dropoffLatLng = null;
                hourlyPickupLatLng = null;
                airportAddressLatLng = null;
                updateSummary();
                setMinDate();
            } else {
                showFieldError('book-name', data.message || 'Could not send. Please call +1 (555) 789-1234 to book.');
            }
        })
        .catch(function () {
            showFieldError('book-name', 'Could not send. Please call +1 (555) 789-1234 or email mail-bookings@eagleeyechauffeur.com to book.');
        })
        .finally(function () {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.querySelector('.btn-text').textContent = 'Request quote & reserve';
            }
        });
    }

    function showFieldError(focusId, message) {
        var el = document.getElementById(focusId);
        if (el) {
            el.focus();
            el.setAttribute('aria-invalid', 'true');
        }
        var existing = document.querySelector('.form-error-message');
        if (existing) existing.remove();
        var msg = document.createElement('p');
        msg.className = 'form-error-message';
        msg.setAttribute('role', 'alert');
        msg.textContent = message;
        form.insertBefore(msg, form.firstChild);
        setTimeout(function () {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
            if (el) el.removeAttribute('aria-invalid');
        }, 6000);
    }

    function init() {
        initTabs();
        setMinDate();
        updateSummary();
        initPlacesAutocomplete();
        ['pickup-address', 'dropoff-address', 'hourly-pickup', 'airport-other-address'].forEach(handleManualAddress);
        if (form) form.addEventListener('submit', handleFormSubmit);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
