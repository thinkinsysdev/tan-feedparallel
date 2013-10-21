var fiber = Npm.require('fibers');
var Future = new Npm.require('fibers/future');

Meteor.methods({
    parallelAsyncJob: function() {
		var feeds = Feeds.find();
      console.log('Parallel Job called at ' + formatDate(new Date()));
      console.log('Post count before refresh: ' + Posts.find().count());
      var urls=[];
          /*
      var urls = ['http://www.wired.com/gamelife/feed/',
             'http://feeds.wired.com/wired/index' ,
               'http://feeds.reuters.com/news/wealth',
               'http://finance.yahoo.com/rss/topstories'
  ];
  */
      feeds.forEach(function(feed) {
        urls.push(feed.url);  
      });
     
	  var futures = _.map(urls,function(url) {
        var future = new Future();
        var onComplete = future.resolver();
        /// Make async http call
        //refreshFeed(feed.url, feed.refreshedDate, function(error, result) {
		refreshFeed(url, function(error, result) {
	
          // Get the title, if there was no error
        
          
          onComplete(error, result);
        });
        
        return future;
      });
      
      // wait for all futures to finish
      Future.wait(futures);
      
      // and grab the results out.
      return _.invoke(futures, 'get');
    }
  });
  
  
  
refreshFeed = function(url) {
 // console.log('In the refresh Feed section for ' + url + ' at ' + lastupdated);
 
  var feed = Feeds.findOne({url:url});
  if (feed) {
  var lastupdated = feed.refreshedDate;
  console.log('found url' + feed.url + ' updated on ' + formatDate(new Date(lastupdated)));
    
    
  var noofitems = Posts.find().count();
    console.log('Before refresh' + noofitems);
  var fp = Meteor.require('feedparser');
  var request = Meteor.require('request');
  var tom = Meteor.users.findOne({profile: { name: 'Tom Coleman' }});
  request(url).pipe(new fp())
  .on ('error', function(error)
  {
       throw error
       })
 .on ('readable', function() {
        var stream = this, item;
     
    while (item = stream.read()) {
      console.log('last updated date: ' + formatDate( new Date(lastupdated)));
     console.log(item.title + 'dated on ' + item.date + ' feed updated on ' + dates.compare(lastupdated, item.meta.date));
      if(dates.compare(lastupdated, item.meta.date))
      {
      console.log('Got article: %s', item.title || item.link);
      
            
        var post =  {
          title: item.title,
          url: item.link,
          description: item.summary,
       userId: tom._id, 
      author: item.author || '', 
      content: item.description,
      imgUrl: item.image.url || '',
      submitted: item.pubdate,//new Date().getTime(),
        commentsCount: 0,
          categories: item.categories,
       upvoters: [], 
          feedname: item.meta.title,
          
  votes: 0
    };
 
      
      new fiber(function() {
        
        
        //logger.log(post.url);
       var postId =  Posts.insert(post);
       console.log(postId);
       
      }).run(post);

      
      } else {
        console.log('exiting because no new feed items found');
       break; 
      }
      
    }
	
	
  });
  } else {
    throw ('Feed not found');
  }
  console.log('After refresh ' + Posts.find().count());
  return (Posts.find().count() - noofitems);
};  

formatDate = function(date) {
 var d = date;
var curr_date = d.getDate();

var curr_month = d.getMonth();

var curr_year = d.getFullYear();

var curr_hour = d.getHours();
var curr_min = d.getMinutes();

var curr_sec = d.getSeconds();
var curr_msec = d.getMilliseconds();

  console.log(curr_date + "-" + curr_month + "-" + curr_year + " " + curr_hour + ":" + curr_min + ":" 
+ curr_sec + ":" + curr_msec);
 return (curr_date + '-' + curr_month + '-' + curr_year + ' ' + curr_hour + ":" + curr_min + ":" 
+ curr_sec + ":" + curr_msec);
};

var dates = {
    convert:function(d) {
        // Converts the date in d to a date-object. The input can be:
        //   a date object: returned without modification
        //  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
        //   a number     : Interpreted as number of milliseconds
        //                  since 1 Jan 1970 (a timestamp) 
        //   a string     : Any format supported by the javascript engine, like
        //                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
        //  an object     : Interpreted as an object with year, month and date
        //                  attributes.  **NOTE** month is 0-11.
        return (
            d.constructor === Date ? d :
            d.constructor === Array ? new Date(d[0],d[1],d[2]) :
            d.constructor === Number ? new Date(d) :
            d.constructor === String ? new Date(d) :
            typeof d === "object" ? new Date(d.year,d.month,d.date) :
            NaN
        );
    },
    compare:function(a,b) {
        // Compare two dates (could be of any type supported by the convert
        // function above) and returns:
        //  -1 : if a < b
        //   0 : if a = b
        //   1 : if a > b
        // NaN : if a or b is an illegal date
        // NOTE: The code inside isFinite does an assignment (=).
        return (
            isFinite(a=this.convert(a).valueOf()) &&
            isFinite(b=this.convert(b).valueOf()) ?
            (a>b)-(a<b) :
            NaN
        );
    },
    inRange:function(d,start,end) {
        // Checks if date in d is between dates in start and end.
        // Returns a boolean or NaN:
        //    true  : if d is between start and end (inclusive)
        //    false : if d is before start or after end
        //    NaN   : if one or more of the dates is illegal.
        // NOTE: The code inside isFinite does an assignment (=).
       return (
            isFinite(d=this.convert(d).valueOf()) &&
            isFinite(start=this.convert(start).valueOf()) &&
            isFinite(end=this.convert(end).valueOf()) ?
            start <= d && d <= end :
            NaN
        );
    }
}