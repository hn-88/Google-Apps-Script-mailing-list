// modified from https://gist.github.com/roblaplaca/11025c3e0cae33f3fc0b

/**
 * Polls for blog's posts for this week and emails it once a week.
 *
 * @frequency This task should run once a week.
 */

function main() {
    var RSS_URL = "https://diaryofasaistudent.blogspot.com/feeds/posts/default?updated-min=2022-11-26T00:00:00&alt=json",
        jsonDoc = getFeedAsJson(RSS_URL),
        // modified using https://github.com/hn-88/bloggerToEbook/blob/main/Code.gs        
        body,
        subject;
        //titles = channel.getChildren("title");
        //Logger.log(jsonDoc)

    for ( i in jsonDoc.feed.entry) {
      Logger.log(jsonDoc.feed.entry[i].title.$t);
      //Logger.log(jsonDoc.feed.entry[i].summary.$t);
      // using https://stackoverflow.com/questions/59251914/how-to-get-the-data-from-the-feed-of-blogspot
      // for the link
      Logger.log(jsonDoc.feed.entry[i].link.pop().href)
      
    }

    
    subject = "DiaryofaSaiStudent updates for this week";
    //body = firstItem.getChildText("description");
    //Logger.log(subject)
    //Logger.log(body)
    //Logger.log(pubDateAsString)
    
    //sendEmailToSelf(subject, body);

}

/**
* Retrieves RSS feed and returns it as an XML object
* which can be traversed.
*
* @param {String} url - url of RSS feed to retrieve
* @returns {XMLObject}
*/

function getRSSFeedAsXML(url) {
    var xmlText = UrlFetchApp.fetch(url).getContentText();
    
    //return Xml.parse(xmlText, true);
    // modified using https://www.labnol.org/code/19733-parse-xml-rss-feeds-google-scripts
    return XmlService.parse(xmlText);
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
* Determines if publish date was more than a day ago
*
* @param {String} pubDateAsString - Date string of a given post
* @returns {Boolean} whether or not the comic was published on the current day
*/

function wasComicPublishedToday(pubDateAsString) {
    var now = new Date(),
        pubDate = new Date(pubDateAsString),
        differenceInDays = ((now.getTime() - pubDate.getTime()) / 1000 / 60 / 60 / 24);

    return (differenceInDays <= 1);
}
