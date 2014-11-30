<?php
// Check for empty fields
if(empty($_POST['name'])  		||
   empty($_POST['email']) 		||
   empty($_POST['message'])	||
   !filter_var($_POST['email'],FILTER_VALIDATE_EMAIL))
   {
	echo "No arguments Provided!";
	return false;
   }

$name = $_POST['name'];
$email_address = $_POST['email'];
$message = $_POST['message'];

try {
    require_once 'src/Mandrill.php'; 
    $mandrill = new Mandrill('wmwyLlm6pEV71G8jmzq0XQ');
    $message = array(
        'html' => 'You have received a new message from your website contact form.\n\nHere are the details:\n\nName: $name\n\nEmail: $email_address\n\nMessage:\n$message',
        'text' => 'Example text content',
        'subject' => 'Website Contact Form:  $name',
        'from_email' => 'hello@arturocalvo.com',
        'from_name' => 'Arturocalvo.com',
        'to' => array(
            array(
                'email' => 'hello@arturocalvo.com',
                'name' => 'Arturo Calvo',
                'type' => 'to'
            )
        ),
        'important' => false,
        'track_opens' => null,
        'track_clicks' => null,
        'auto_text' => null,
        'auto_html' => null,
        'inline_css' => null,
        'url_strip_qs' => null,
        'preserve_recipients' => null,
        'view_content_link' => null,
        'tracking_domain' => null,
        'signing_domain' => null,
        'return_path_domain' => null,
    );
    $async = false;
    $result = $mandrill->messages->send($message, $async, $ip_pool, $send_at);
    return true;
} catch(Mandrill_Error $e) {
    // Mandrill errors are thrown as exceptions
    return false;
}
?>