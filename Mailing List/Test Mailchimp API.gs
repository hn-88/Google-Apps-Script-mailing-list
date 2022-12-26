// moving all the mailchimp functions here

// modified from https://gist.github.com/roblaplaca/11025c3e0cae33f3fc0b

// adding the mailchimp api constants as global 
// https://mailchimp.com/developer/marketing/guides/quick-start/#make-your-first-api-call
const mailchimpApiKey = "04thisKeyIsRevokedNowb8a3-us21";
const mailchimpDC = "us21";

function sendMCTestEmail() {
/*  
curl -X POST \
  https://${dc}.api.mailchimp.com/3.0/campaigns/{campaign_id}/actions/test \
  --user "anystring:${apikey}"' \
  -d '{"test_emails":[],"send_type":"html"}'
  */

  var url = 'https://'+mailchimpDC+'.api.mailchimp.com/3.0/campaigns/4c2fd9cce6/actions/test';
  // https://stackoverflow.com/questions/23546255/how-to-use-urlfetchapp-with-credentials-google-scripts
  var options = {
    'method'    : 'post',
    'payload'   : '{"test_emails":["myemail@mydomain.org","myemail@gmail.com"],"send_type":"html"}',
    'headers': {
        "Authorization": "Basic " + Utilities.base64Encode("anystring" + ":" + mailchimpApiKey)
    }
  };

  var responseText = UrlFetchApp.fetch(url,options).getContentText();
  Logger.log(responseText);

}

function getMCListofCampaigns() {
/*  
curl -X GET \
  'https://${dc}.api.mailchimp.com/3.0/campaigns?fields=<SOME_ARRAY_VALUE>&exclude_fields=<SOME_ARRAY_VALUE>&count=10&offset=0&type=<SOME_STRING_VALUE>&status=<SOME_STRING_VALUE>&before_send_time=<SOME_STRING_VALUE>&since_send_time=<SOME_STRING_VALUE>&before_create_time=<SOME_STRING_VALUE>&since_create_time=<SOME_STRING_VALUE>&list_id=<SOME_STRING_VALUE>&folder_id=<SOME_STRING_VALUE>&member_id=<SOME_STRING_VALUE>&sort_field=<SOME_STRING_VALUE>&sort_dir=<SOME_STRING_VALUE>' \
  --user "anystring:${apikey}"'    
  */

  var url = 'https://'+mailchimpDC+'.api.mailchimp.com/3.0/campaigns?fields=campaigns.id,campaigns.create_time,campaigns.settings.title,campaigns.settings.subject_line';
  // https://stackoverflow.com/questions/23546255/how-to-use-urlfetchapp-with-credentials-google-scripts
  var options = {
    'headers': {
        "Authorization": "Basic " + Utilities.base64Encode("anystring" + ":" + mailchimpApiKey)
    }
  };

  var responseText = UrlFetchApp.fetch(url,options).getContentText();
  Logger.log(responseText);

}

