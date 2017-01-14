require('dotenv').config();
var jsdom = require("jsdom");
var fs = require("fs");
var http = require('http');
var url = require("url");
var path = require("path");
var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.slim.js", "utf-8"); 
var PDFParser = require("pdf2json");
var source = process.env.source;

if (source == "URL") {
  jsdom.env({
    url: process.env.URL,
    src: [jquery],
    done: function (err, window) {
      var $ = window.$;
      console.log("Finding menu...");
      var menu = $("#menudownloads li a")
      .filter(function(){
        return $(this).text().toLowerCase() == "weekly menu";
      })
      .first();
    
      if (typeof menu != 'undefined' && menu != null && menu.length > 0) {
        console.log("Menu found!");
        var menuHref = menu.attr("href");
        var menuUrl = window.location.protocol + "//" + window.location.host + "/" + menuHref;
        var parsed = url.parse(menuUrl);
        var filename = path.basename(parsed.pathname)
        console.log(menuUrl);
        console.log(filename);
        download(menuUrl, filename, function(success, message){
          if (success == true) {
            console.log("Downloaded file " + filename);
          }
          else {
            console.log("Error downloading file " + filename);
            console.log(message);
          }
        });
      } 
      else {
        console.log("Could not locate menu");
      }
    }
  });

  var download = function(url, dest, cb) {
    var request = http.get(url, function(response) {
      parseFromStream(response);
    }).on('error', function(err) {
      if (cb) {
        cb(false, err.message);
      }
    });
  };
}
else if (source == "FILE") {
  var readable = fs.createReadStream(process.env.file);
  parseFromStream(readable);
}
else {
  process.exit(1);
}

function parseFromStream(rs) {
  console.log("Reading stream...");
  var buffers = [];
  rs.on('data', function(buffer) {
    buffers.push(buffer);
  });
  rs.on('end', function() {
    console.log("Stream ended, parsing pdf");
    var buffer = Buffer.concat(buffers);
    let pdfParser = new PDFParser(this,1);
    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
    pdfParser.on("pdfParser_dataReady", parsePDFData);
    pdfParser.parseBuffer(buffer);
  });
}

function parsePDFData(pdfData) {
  var page = pdfData["formImage"]["Pages"][0];
  var texts = [];
  // Flatten text arrays, remove unused attributes
  var count = 0;
  page["Texts"].forEach(function(e) {
    var n = {};
    n.id = count++;
    n.xStart = parseFloat(parseFloat(e.x).toFixed(3));
    n.xEnd = parseFloat((parseFloat(e.x) + parseFloat(e.w)).toFixed(3));
    n.y = parseFloat(parseFloat(e.y).toFixed(3));
    n.w = e.w;
    n.text = "";
    e.R.forEach(function(t) {
      n.text = n.text + t.T;
    }, this);
    n.text = decodeURIComponent(n.text);
    texts.push(n);
  }, this);
  // console.log(JSON.stringify(texts));

  // array of unique yVals
  var yVals = [];
  function pushIfNotExits(array, element) {
    if (array.indexOf(element) === -1) {
      array.push(element);
    }
  }

  texts.forEach(function(e) {
    pushIfNotExits(yVals, e.y);
  }, this);

  // console.log(yVals.length);
  // console.log(yVals[4]);
  // console.log(JSON.stringify(yVals));

  var yLine = [];
  texts.forEach(function(e){
    if (e.y == 13.446) {
      yLine.push(e);
    }
  }, this);

  var yLineNext = true;
  var yIds = [];

  yLine.forEach(function(e){
    yIds.push(e.id);
  }, this);

  function getById(array, id) {
    for (var i = 0; i < array.length; i++) {
      if (array[i].id == id) {
        return array[i];
      }
    }
  }

  while (yLineNext) {
    var group = {};
    group.texts = [];
    var nextYIds = [];
    for(var i = 0; i < yIds.length; i++) {
      var id = yIds[i];
      if (i == 0) {
        group.texts.push(getById(yLine, id));
      }
    }
    yIds.forEach(function(id) {
      
    }, this);
  }

  // Read first element, 
  //    add to new object
  //    remove from pool of id's to process
  // read next element then check
  //    is the ID consecutive
  //    does the text overlap/touch
  //      add to object array
  //      remove from pool of id's to process
  // continue reading elements until array is exhausted
  // start from step 1 again, with the new pool of id's
  // might be easier to just add the next round of id's to the array


  console.log(JSON.stringify(yLine));

}
