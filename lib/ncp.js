

var fs = require('fs'),
    path = require('path');

var ncp = exports.ncp = function (source, dest, callback) {
  
  var basePath = process.cwd(),
      currentPath = (source[0] === '/') ? source : basePath + '/' + source,
      targetPath = (dest[0] === '/') ? dest : basePath + '/' + dest,
      mutex = 0;

  getStats(currentPath);
  
  function getStats(item) {
    mutex++;
    fs.stat(item, function (err, stats) {
      if (err) {
        return onError(err);
      }
      if (stats.isDirectory()) {
        return onDir(item);
      }
      else if (stats.isFile()) {
        return onFile(item);
      }
    });  
  }

  function onFile(file) {
    var target = file.replace(currentPath, targetPath);
    path.exists(target, function (exists) {
      if (exists) {
        return rmFile(target, function () {
          copyFile(file, target);
        });
      }
      copyFile(file, target);
    });
  }

  function copyFile(file, target) {
    fs.readFile(file, function (err, data) {
      if (err) {
        return onError(err);
      }
      fs.writeFile(target, data, function (err) {
        if (err) {
          return onError(err);
        }
        mutex--;
        return cb();
      });
    });
  }

  function rmFile(file, done) {
    fs.unlink(file, function (err) {
      if (err) {
        return onError(err);
      }
      return done();
    });
  }

  function onDir(dir) {
    var target = dir.replace(currentPath, targetPath);
    path.exists(target, function (exists) {
      if (exists) {
        return copyDir(dir, target);
      }
      mkDir(dir, target);
    });
  }

  function mkDir(dir, target) {
    fs.mkdir(target, 0755, function (err) {
      if (err) {
        return onError(err);
      }
      copyDir(dir);
    });
  }

  function copyDir(dir) {
    fs.readdir(dir, function (err, items) {
      if (err) {
        return onError(err);
      }
      items.forEach( function (item) {
        getStats(dir + '/' + item);
      });
      mutex--;
      return cb();
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