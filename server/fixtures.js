console.log('In the fixtures page');

Posts.remove({});
console.log(Feeds.find().count());
Feeds.remove({});
if(Feeds.find().count() === 0)
{
  console.log('Did not find any feeds');
  var url = ['http://www.wired.com/gamelife/feed/',
             'http://feeds.wired.com/wired/index'   
  ];
  console.log('no of urls: ' + url.length);
  
  for (i =0; i < url.length; i++)
  {
    console.log('inserting a feed: ' + url[i]);
    Feeds.insert({url: url[i], refreshedDate: new Date()-10*24*3600});
  }
  
}
Meteor.call('parallelAsyncJob', function(err, titles) {
        if (typeof console !== 'undefined') {
          console.log('Fetched ' + titles.length + ' titles: ');
          _.each(titles, function(title) {
            console.log(' ' + title);
          });
        }
      });
//Meteor.setInterval(Meteor.call('parallelAsyncJob', 60000));