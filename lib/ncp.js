var fs = require('fs'),
    path = require('path');

var ncp = exports;

ncp.ncp = function (source, dest, options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }

  var basePath = process.cwd(),
      currentPath = path.resolve(basePath, source),
      targetPath = path.resolve(basePath, dest),
      filter = options.filter,
      errs = null,
      started = 0,
      finished = 0,
      running = 0,
      limit = options.limit || ncp.limit || 16;

  limit = (limit < 1) ? 1 : (limit > 512) ? 512 : limit;

  startCopy(currentPath);
  
  function startCopy(item) {
    started++;
    if (filter) {
      if (filter instanceof RegExp) {
        if (!filter.test(item)) {
          return cb();
        }
      }
      else if (typeof filter === 'function') {
        if (!filter(item)) {
          return cb();
        }
      }
    }
    return getStats(item);
  }

  function getStats(item) {
    if (running >= limit) {
      return process.nextTick(function () {
        getStats(item);
      });
    }
    running++;
    fs.lstat(item, function (err, stats) {
      if (err) {
        return onError(err);
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
    var readStream = fs.createReadStream(file),
        writeStream = fs.createWriteStream(target);
    readStream.pipe(writeStream);
    readStream.once('end', cb);
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
      items.forEach(function (item) {
        startCopy(dir + '/' + item);
      });
      return cb();
    });
  }

  function onLink(link) {
    var target = link.replace(currentPath, targetPath);
    fs.readlink(link, function (err, resolvedPath) {
      if (err) {
        return onError(err);
      }
      checkLink(resolvedPath, target);
    });
  }

  function checkLink(resolvedPath, target) {
    path.exists(target, function (exists) {
      if (exists) {
        return fs.readlink(target, function (err, targetDest) {
          if (err) {
            return onError(err);
          }
          if (targetDest === resolvedPath) {
            return cb(); 
          }
          return rmFile(link, function () {
            makeLink(resolvedPath, target);
          });
        });
      }
      makeLink(resolvedPath, target);
    });
  }

  function makeLink(linkPath, target) {
    fs.symlink(linkPath, target, function (err) {
      if (err) {
        return onError(err);
      }
      return cb();
    });
  }

  function onError(err) {
    if (options.stopOnError) {
      return callback(err);
    }
    else if (!errs && options.errs) {
      errs = fs.createWriteStream(options.errs);
    }
    else if (!errs) {
      errs = [];
    }
    else if (options.errs) { 
      if (typeof errs.write === 'undefined') {
        errs.push(err);
      }
      else { 
        errs.write(err.stack + '\n\n');
      }
    }
    return cb();
  }

  function cb() {
    running--;
    finished++;
    if ((started === finished) && (running === 0)) {
      return errs ? callback(errs) : callback(null);
    }
  }
}



