

var fs = require('fs'),
    path = require('path');

var ncp = exports;

ncp.ncp = function (source, dest, callback) {
  
  var basePath = process.cwd(),
      currentPath = (source[0] === '/') ? source : basePath + '/' + source,
      targetPath = (dest[0] === '/') ? dest : basePath + '/' + dest,
      started = 0,
      finished = 0,
      running = 0;

  getStats(currentPath);
  
  function getStats(item) {
    started++;
    (function tryStat(item) {
      if (running >= ncp.limit) {
        return process.nextTick(function () {
          tryStat(item);
        });
      }
      running++;
      fs.lstat(item, function (err, stats) {
        if (err) {
          return callback(err);
        }
        if (stats.isDirectory()) {
          return onDir(item);
        }
        else if (stats.isFile()) {
          return onFile(item);
        }
        else if (stats.isSymbolicLink()) {
          return onLink(item);
        }
      });
    })(item);
  }

  function onFile(file) {
    var target = file.replace(currentPath, targetPath);
    path.exists(target, function (exists) {
      if (exists) {
        return rmFile(target, function () {
          streamCopy(file, target);
        });
      }
      streamCopy(file, target);
    });
  }

  function streamCopy(file, target) {
    var readStream = fs.createReadStream(file),
        writeStream = fs.createWriteStream(target);
    readStream.pipe(writeStream);
    readStream.once('end', function () {
      finished++;
      return cb();
    });
  }

  function rmFile(file, done) {
    fs.unlink(file, function (err) {
      if (err) {
        return callback(err);
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
        return callback(err);
      }
      copyDir(dir);
    });
  }

  function copyDir(dir) {
    fs.readdir(dir, function (err, items) {
      if (err) {
        return callback(err);
      }
      items.forEach( function (item) {
        getStats(dir + '/' + item);
      });
      finished++;
      return cb();
    });
  }

  function onLink(link) {
    var target = link.replace(currentPath, targetPath);
    fs.readlink(link, function (err, resolvedPath) {
      if (err) {
        return callback(err);
      }
      checkLink(resolvedPath, target);
    });
  }

  function checkLink(resolvedPath, target) {
    path.exists(target, function (exists) {
      if (exists) {
        return rmFile(link, function () {
          process.nextTick(function () { 
            copyLink(resolvedPath, target);
          });
        });
      }
      copyLink(resolvedPath, target);
    });
  }

  function copyLink(linkPath, target) {
    fs.symlink(linkPath, target, function (err) {
      if (err) {
        return callback(err);
      }
      finished++;
      return cb();
    });
  }

  function cb() {
    running--;
    if ((started === finished)&&(running === 0)) {
      return callback();
    }
  }
}

ncp.limit = 32;

