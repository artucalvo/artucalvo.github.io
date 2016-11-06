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
$html = 'You have received a new message from your website contact form.<br><br>Here are the details:<br><br>Name: '.$name.'<br><br>Email: '.$email_address.'<br><br>Message:<br>'.$message;

require("sendgrid-php/sendgrid-php.php");

$apiKey = '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';
$sg = new \SendGrid($apiKey);

$request_body = json_decode('{
  "personalizations": [
    {
      "to": [
        {
          "email": "hello@arturocalvo.com"
        }
      ],
      "subject": "Website Contact Form: '.$name.'"
    }
  ],
  "from": {
    "email": "hello@arturocalvo.com"
  },
  "content": [
    {
      "type": "text/html",
      "value": "'.$html.'"
    }
  ]
}');

$result = $sg->client->mail()->send()->post($request_body);

return true;
?>