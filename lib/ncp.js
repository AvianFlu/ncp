

var fs = require('fs'),
    path = require('path');

var ncp = exports.ncp = function (source, dest, callback) {
  
  var basePath = process.cwd(),
      currentPath = (source[0] === '/') ? source : basePath + '/' + source,
      mutex = 0;

  getStats(currentPath);
  
  function getStats(item) {
    mutex++;
    fs.stat(item, function (err, stats) {
      if (err) {
        return onError(err);
      }
      if (stats.isDirectory()) {
            // directory code
        return onDir(item);
      }
      else if (stats.isFile()) {
        // file code
        return onFile(item);
      }
    });  
  }

  function onFile(file) {
    fs.readFile(file, function (err, data) {
      if (err) {
        return onError(err);
      }
      fs.writeFile(file.replace(source, dest), data, function (err) {
        if (err) {
          return onError(err);
        }
        mutex--;
        return cb();
      });
    });
  }

  function onDir(dir) {
    fs.mkdir(dir.replace(source, dest), 0755, function (err) {
      if (err) {
        return onError(err);
      }
      fs.readdir(dir, function (err, items) {
        if (err) {
          return onError(err);
        }
        mutex--;
        items.forEach( function (item) {
          getStats(dir + '/' + item);
        });
        return cb();
      });
    });
  }

  function onError(err) {
    return callback(new Error(err.message));
  }

  function cb() {
    if (mutex === 0) {
      return callback();
    }
  }

}