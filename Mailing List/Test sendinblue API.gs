/*

from https://developers.sendinblue.com/docs/send-a-transactional-email

curl --request POST \
  --url https://api.sendinblue.com/v3/smtp/email \
  --header 'accept: application/json' \
  --header 'api-key:xkeysib-92c1myAPIKey-X0A' \
  --header 'content-type: application/json' \
  --data '{  
   "sender":{  
      "name":"sendername",
      "email":"something@gmail.com"
   },
   "to":[  
      {  
         "email":"somebody@somedomain.org",
         "name":"receiver name"
      }
   ],
   "subject":"test mail using s i b api",
   "htmlContent":"<html><head></head><body><h1>Hello this is a test email from sib</h1></body></html>"   
}'

*/

var sibApiKey = 'xkeysib-92c11e16---------REDACTED-----00000000000000000000000000000A';

function myFunction() {

  var url = 'https://api.sendinblue.com/v3/smtp/email';
  var options = {
    'method'    : 'post',
    'payload'   : `{ 
      "sender":{ 
        "name":"sender name",       
        "email":"sender@gmail.com"    
        },
      "to":[  
      {  
         "email":"receiver@somedomain.org",
         "name":"Receiver Name"
      }
   ],
   "subject":"test mail using s i b api on GAS",
   "htmlContent":"<html><head></head><body><h3>This is a test email using GAS</h3></body></html>"   
}`,
    'headers': {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key" :  sibApiKey
    }
  };

  Logger.log(options.headers );
  Logger.log(options.payload);

  var responseText = UrlFetchApp.fetch(url,options).getContentText();
  Logger.log(responseText);
  
}
