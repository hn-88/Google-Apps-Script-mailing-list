// modified from https://gist.github.com/roblaplaca/11025c3e0cae33f3fc0b

/**
 * Polls for blog's posts for this week and emails it once a week.
 *
 * @frequency This task should run once a week.
 */

function main() {
    var RSS_URL = "https://diaryofasaistudent.blogspot.com/feeds/posts/default?updated-min=2022-11-27T00:00:00&alt=json",
        jsonDoc = getFeedAsJson(RSS_URL),
        // modified using https://github.com/hn-88/bloggerToEbook/blob/main/Code.gs        
        body = '<h3>Posts updated this week</h3>\n',
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
    body += '</p>\n';
    
    subject = "DiaryofaSaiStudent updates for this week";
        
    sendEmailToSelf(subject, body);

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
