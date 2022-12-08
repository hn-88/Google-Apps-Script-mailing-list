// modified from https://gist.github.com/roblaplaca/11025c3e0cae33f3fc0b

// adding the mailchimp api constants as global 
// https://mailchimp.com/developer/marketing/guides/quick-start/#make-your-first-api-call
const mailchimpApiKey = "04thisKeyIsRevokedNowb8a3-us21";
const mailchimpDC = "us21";


/**
 * Polls for blog's posts for this week and emails it once a week.
 *
 * @frequency This task should run once a week.
 */

function main() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('RSS');
    var RSSvals = sheet.getRange("A1:C1").getValues();
     
    // https://developers.google.com/apps-script/reference/utilities/utilities#formatDate(Date,String,String)
    var formattedDate = Utilities.formatDate(new Date(), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
    
    var RSS_URL = RSSvals[0][0]+RSSvals[0][1]+RSSvals[0][2],
        jsonDoc = getFeedAsJson(RSS_URL),
        // modified using https://github.com/hn-88/bloggerToEbook/blob/main/Code.gs        
        body = '<h3>Posts updated this week</h3><h4>(May contain links to posts with minor edits also)</h4>\n',
        subject;
        
    body += '<p>\n';

    for ( i in jsonDoc.feed.entry) {
      //Logger.log(jsonDoc.feed.entry[i].title.$t);
      //Logger.log(jsonDoc.feed.entry[i].summary.$t);
      // using https://stackoverflow.com/questions/59251914/how-to-get-the-data-from-the-feed-of-blogspot
      // for the link
      //Logger.log(jsonDoc.feed.entry[i].link.pop().href)
      body += '<a href="' + jsonDoc.feed.entry[i].link.pop().href
           + '" target="_blank">'
           + jsonDoc.feed.entry[i].title.$t
           + '</a> <br>\n';      
    }
    body += '</p><br><br>\n'
         +  '<p><small>You have received this email due to signing up at <a href="https://diaryofasaistudent.blogspot.com/" target="_blank">https://diaryofasaistudent.blogspot.com/</a>.</small></p>'
         +  '<p><small>If you do not wish to get these emails every week, please reply to this email stating you would like to unsubscribe. </small></p>'
         +  '<p><small>The <a href="https://github.com/hn-88/Google-Apps-Script-mailing-list/blob/main/LICENSE" target="_blank">MIT licensed</a> Source-code of this mailing list implementation is at  <a href="https://github.com/hn-88/Google-Apps-Script-mailing-list" target="_blank">https://github.com/hn-88/Google-Apps-Script-mailing-list</a>. </small></p>';
    
    subject = "DiaryofaSaiStudent posts updated this week";
        
    sendEmailToList(subject, body);

    sheet.getRange("B1").setValue(formattedDate);
    
}


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

function getFeedAsJson(url) {
    var jsonText = UrlFetchApp.fetch(url).getContentText();
    
    // modified using https://github.com/hn-88/bloggerToEbook/blob/main/Code.gs
    return JSON.parse(jsonText);
}

/**
* Sends an email to yourself
*
* @param {String} subject - email subject line
* @param {String} body - HTML markup to be used as body content for the email
*/

function sendEmailToSelf(subject, body) {
    var recipient = Session.getActiveUser().getEmail();

    GmailApp.sendEmail(recipient, subject, "", {
        htmlBody: body
    });
}

/**
* Sends an email to the list
*
* @param {String} subject - email subject line
* @param {String} body - HTML markup to be used as body content for the email
*/

function sendEmailToList(subject, body) {

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');
    // via https://stackoverflow.com/questions/14991030/get-value-in-one-column-in-spreadsheet-using-google-apps-script
    var Avals = sheet.getRange("A1:A").getValues();
    var numberOfAVals = Avals.filter(String).length;

    //Logger.log(numberOfAVals);
    for (n=0;n<numberOfAVals;n++) {
      var recipient = Avals[n];
      //Logger.log(recipient)

      GmailApp.sendEmail(recipient, subject, "", {
          htmlBody: body
      });
    }
}
