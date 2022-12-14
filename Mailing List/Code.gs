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
         +  '<p><small>The <a href="https://github.com/hn-88/Google-Apps-Script-mailing-list/blob/main/LICENSE" target="_blank">MIT licensed</a> Source-code of this mailing list implementation is at  <a href="https://github.com/hn-88/Google-Apps-Script-mailing-list" target="_blank">https://github.com/hn-88/Google-Apps-Script-mailing-list</a>. </small></p>'
         +  '<p><small>If you do not wish to get these emails every week, please reply to this email stating you would like to unsubscribe, or use the link below to unsubscribe. </small></p>\n';
             
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
    var Bvals = sheet.getRange("B1:B").getValues();
    var Cvals = sheet.getRange("C1:C").getValues();
    var numberOfAVals = Avals.filter(String).length;

    //Logger.log(numberOfAVals);
    for (n=0;n<numberOfAVals;n++) {
      var recipient = Avals[n];
      var hash = Cvals[n];
      //Logger.log(recipient)
      // send email only if Bval is 'confirmed'
      if(Bvals[n]=='confirmed') {
        GmailApp.sendEmail(recipient, subject, "", {
            htmlBody: body+addunsublink(recipient, hash)
        });
      }
    }
}

/**
* Returns an unsubscribe link as HTML which can be appended to body
*
* @param {String} email - email id of recipient
* @param {String} hash - unique unsubscribe hash
*/
function addunsublink(email, hash) {
  
  deploymentid = 'AKfycbxFqJgJoxaZa3oOsFJeP_Lnk6dRBVPYKo94cZTJyWaAo-di1DeWq3e4RBXEaT7iuthN';
  linkval = 'https://script.google.com/macros/s/'
            + deploymentid
            +  '/exec?email='
            + encodeURIComponent(email)
            + '&unsubscribe_hash='
            + hash;
  linktext = '<p><small><a href="'
           + linkval
           + '">Unsubscribe</a></small></p> '
  Logger.log(linktext);
  return linktext;
}

function checkQuota() {
  Logger.log(MailApp.getRemainingDailyQuota());
}

// the following are via
// https://ravgeetdhillon.medium.com/add-unsubscribe-link-in-emails-using-google-apps-script-475c938b3e9f

function getMD5Hash(value) {
  value = value + generateRandomString(9); // added this
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,
                                         value,
                                         Utilities.Charset.UTF_8);
  let hash = '';
  for (i = 0; i < digest.length; i++) {
    let byte = digest[i];
    if (byte < 0) byte += 256;
    let bStr = byte.toString(16);
    if (bStr.length == 1) bStr = '0' + bStr;
    hash += bStr;
  }
  //Logger.log(hash)
  return hash;
}

function generateRandomString(length) {
  const randomNumber = Math.pow(36, length + 1) - Math.random() * Math.pow(36, length);
  const string = Math.round(randomNumber).toString(36).slice(1);
  return string;
}

// This doGet implements unsubscribe

function doGet(e) {
  const email = e.parameter['email'];
  const s = e.parameter['s'];
  
  if (s=='unsub') {
  const unsubscribeHash = e.parameter['unsubscribe_hash'];
  const success = unsubscribeUser(email, unsubscribeHash);
  if (success) return ContentService.createTextOutput().append('You have unsubscribed.');
  return ContentService.createTextOutput().append('Failed');
  }
  
  if (s=='sub') {
  const returnvalue = subscribeUser(email);
  if (returnvalue == "success") return ContentService.createTextOutput().append('You will be sent a confirmation email.');
  
  }

  if (s=='conf') {
  const subscribeHash = e.parameter['subscribe_hash'];
  const returnvalue = confirmUser(email, subscribeHash);
  if (returnvalue == "success") return ContentService.createTextOutput().append('You will start receiving regular email updates.');
  
  }
  // the following will be invoked only if
  // neither sub nor unsub was invoked
  // or if either of them failed
  return ContentService.createTextOutput().append('Failed');
  
}


function unsubscribeUser(emailToUnsubscribe, unsubscribeHash) {  
  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  /*
  // get headers
  const headers = data[0];

  // get the index of each header
  const emailIndex = headers.indexOf('email');
  const unsubscribeHashIndex = headers.indexOf('unsubscribe_hash');
  const subscribedIndex = headers.indexOf('subscribed');
  */
  const emailIndex = 0;
  const unsubscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const hash = row[unsubscribeHashIndex];

    // if the email and unsubscribe hash match with the values in the sheet
    // then update the subscribed value to 'no'
    if (emailToUnsubscribe === email && unsubscribeHash === hash) {
      sheet.getRange(i+1, subscribedIndex+1).setValue('no');
      return true;
    }
  }
}

function confirmUser(emailtosub, subhash) {  
  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  const emailIndex = 0;
  const subscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const hash = row[subscribeHashIndex];

    // if the email and hash match with the values in the sheet
    // then update the subscribed value to 'confirmed'
    if (emailtosub === email && subhash === hash) {
      sheet.getRange(i+1, subscribedIndex+1).setValue('confirmed');
      return true;
    }
  }
}


// The following function 
// 1. checks if the email being entered for subscription already exists
// 2. If already exists, checks if confirmed
// 3. If doesn't exist, adds and returns success.
// 4. Other possible return values are 
//     confirmed, unconfirmed, unsubscribed
function subscribeUser(emailToSubscribe) {  
  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  const emailIndex = 0;
  const unsubscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const issubscribed = row[subscribedIndex];

    // if the email matches with the values in the sheet
    // then update the subscribed value to 'no'
    if (emailToSubscribe === email) {
      if (issubscribed === 'confirmed') {
        return issubscribed;
      }
      if (issubscribed === 'no') {
        return 'unsubscribed';
      }
      if (issubscribed === '') {
        return 'unconfirmed';
      }  
    }

  }
  // emailToSubscribe is not found, so append it
  // add the hash and send a confirmation email
  var subscribe_hash = getMD5Hash(emailToSubscribe);
  var row =  [emailToSubscribe, "", subscribe_hash];
  sheet.appendRow(row);
  sendConfirmationEmail(emailToSubscribe,subscribe_hash);
  return 'success';
}

function sendConfirmationEmail(emailToSubscribe,subscribe_hash) { 
  // todo
}


function updatehashes() {  
  // get the active sheet which contains our emails
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Emails');

  // get the data in it
  const data = sheet.getDataRange().getValues();
  
  /*
  // get headers
  const headers = data[0];

  // get the index of each header
  const emailIndex = headers.indexOf('email');
  const unsubscribeHashIndex = headers.indexOf('unsubscribe_hash');
  const subscribedIndex = headers.indexOf('subscribed');
  */
  const emailIndex = 0;
  const unsubscribeHashIndex = 2;
  const subscribedIndex = 1;
  
  // iterate through the data 
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const email = row[emailIndex];
    const hash = getMD5Hash(email);
    sheet.getRange(i+1, unsubscribeHashIndex+1).setValue(hash);    
  }
}


