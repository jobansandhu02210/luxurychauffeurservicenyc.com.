<?php
/**
 * Eagle Eye Chauffeur - Booking Form Handler
 * Sends booking requests to mail-bookings@eagleeyechauffeur.com
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$BOOKING_EMAIL = 'mail-bookings@eagleeyechauffeur.com';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$data = $_POST;

$serviceType = isset($data['service_type']) ? $data['service_type'] : 'Unknown';
$vehicle = isset($data['vehicle']) ? $data['vehicle'] : 'Not specified';
$estimatedTotal = isset($data['estimated_total']) ? $data['estimated_total'] : '—';
$date = isset($data['trip_date']) ? $data['trip_date'] : '';
$time = isset($data['trip_time']) ? $data['trip_time'] : '';
$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$email = isset($data['email']) ? trim($data['email']) : '';
$notes = isset($data['notes']) ? trim($data['notes']) : '';

// Build trip details by service type
$tripDetails = '';
if ($serviceType === 'point-to-point') {
    $pickup = isset($data['pickup_address']) ? trim($data['pickup_address']) : '';
    $dropoff = isset($data['dropoff_address']) ? trim($data['dropoff_address']) : '';
    $tripDetails = "Pickup: $pickup\nDrop-off: $dropoff";
} elseif ($serviceType === 'hourly') {
    $pickup = isset($data['hourly_pickup']) ? trim($data['hourly_pickup']) : '';
    $duration = isset($data['hourly_duration']) ? $data['hourly_duration'] : '';
    $tripDetails = "Pickup: $pickup\nDuration: $duration hours";
} elseif ($serviceType === 'airport') {
    $direction = isset($data['airport_direction']) ? $data['airport_direction'] : '';
    $address = isset($data['airport_other_address']) ? trim($data['airport_other_address']) : '';
    $airport = isset($data['airport']) ? $data['airport'] : '';
    $flight = isset($data['flight_number']) ? trim($data['flight_number']) : '';
    $tripDetails = "Direction: $direction\nAddress: $address\nAirport: $airport\nFlight: " . ($flight ?: 'N/A');
} else {
    $tripDetails = "Pickup: " . (isset($data['pickup_address']) ? $data['pickup_address'] : '') . "\nDrop-off: " . (isset($data['dropoff_address']) ? $data['dropoff_address'] : '');
}

$subject = "Booking Request - $name - $date $time";
$body = "New booking request from Eagle Eye Chauffeur website\n\n";
$body .= "=== TRIP DETAILS ===\n";
$body .= "Service: $serviceType\n";
$body .= "Vehicle: $vehicle\n";
$body .= "Estimated total: $estimatedTotal\n";
$body .= "Date: $date\n";
$body .= "Time: $time\n\n";
$body .= "=== TRIP LOCATION ===\n$tripDetails\n\n";
$body .= "=== CONTACT ===\n";
$body .= "Name: $name\n";
$body .= "Phone: $phone\n";
$body .= "Email: $email\n\n";
if ($notes) {
    $body .= "=== NOTES ===\n$notes\n";
}
$body .= "\n---\nSent from eagleeyechauffeur.com booking form";

$headers = "From: noreply@eagleeyechauffeur.com\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($BOOKING_EMAIL, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Could not send. Please try again or call us.']);
}
