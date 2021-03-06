require('dotenv').config();
var jsdom = require("jsdom");
var fs = require("fs");
var http = require('http');
var url = require("url");
var path = require("path");
var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.slim.js", "utf-8"); 
var PDFParser = require("pdf2json");
var source = process.env.source;
// var querystring = require('querystring');

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
  page["Texts"].forEach(function(e) {
    var n = {};
    n.xStart = e.x;
    n.xEnd = (parseFloat(e.x) +  parseFloat(e.w)).toFixed(3);
    n.y = e.y;
    n.w = e.w;
    n.text = "";
    e.R.forEach(function(t) {
      n.text = n.text + t.T;
    }, this);
    n.text = decodeURIComponent(n.text);
    texts.push(n);
  }, this);
  console.log(JSON.stringify(texts));
}
