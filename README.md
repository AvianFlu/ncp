# ncp - Asynchronous recursive file & directory copying

[![Build Status](https://secure.travis-ci.org/AvianFlu/ncp.png)](http://travis-ci.org/AvianFlu/ncp)

Think `cp -r`, but pure node, and asynchronous.  `ncp` can be used both as a CLI tool and programmatically.

## Command Line usage

Usage is simple: `ncp [source] [dest] [--limit=concurrency limit]
[--filter=filter] --stopOnErr`

The 'filter' is a Regular Expression - matched files will be copied.

The 'concurrency limit' is an integer that represents how many pending file system requests `ncp` has at a time.

'stoponerr' is a boolean flag that will tell `ncp` to stop immediately if any
errors arise, rather than attempting to continue while logging errors. The default behavior is to complete as many copies as possible, logging errors along the way.

If there are no errors, `ncp` will output `done.` when complete.  If there are errors, the error messages will be logged to `stdout` and to `./ncp-debug.log`, and the copy operation will attempt to continue.

## Programmatic usage

Programmatic usage of `ncp` is just as simple.  The only argument to the completion callback is a possible error.  

```javascript
var ncp = require('ncp').ncp;

ncp.limit = 16;

ncp(source, destination, function (err) {
 if (err) {
   return console.error(err);
 }
 console.log('done!');
});
```

You can also call ncp like `ncp(source, destination, options, callback)`. 
`options` should be a dictionary. Currently, such options are available:

  * `options.filter` - a `RegExp` instance, against which each file name is
  tested to determine whether to copy it or not, or a function taking single
  parameter: copied file name, returning `true` or `false`, determining
  whether to copy file or not.

  * `options.transform` - a function: `function (read, write) { read.pipe(write) }`
  used to apply streaming transforms while copying.

  * `options.clobber` - boolean=true. if set to false, `ncp` will not overwrite 
  destination files that already exist.

  * `options.dereference` - boolean=false. If set to true, `ncp` will follow symbolic
  links. For example, a symlink in the source tree pointing to a regular file
  will become a regular file in the destination tree. Broken symlinks will result in
  errors.

  * `options.stopOnErr` - boolean=false.  If set to true, `ncp` will behave like `cp -r`,
  and stop on the first error it encounters. By default, `ncp` continues copying, logging all
  errors and returning an array.

  * `options.errs` - stream. If `options.stopOnErr` is `false`, a stream can be provided, and errors will be written to this stream.

  * `options.fs` - [Node.JS File System](http://nodejs.org/api/fs.html) compliant implementation. If provided, this will be used instead of `fs`.
  The custom implementation must have the following methods implemented:
    * [`fs.stat(path, callback)`](http://nodejs.org/api/fs.html#fs_fs_stat_path_callback)
    * [`fs.lstat(path, callback)`](http://nodejs.org/api/fs.html#fs_fs_lstat_path_callback)
    * [`fs.createReadStream(path[, options])`](http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options)
    * [`fs.createWriteStream(path[, options])`](http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options)
    * [`fs.utimesSync(path, atime, mtime)`](http://nodejs.org/api/fs.html#fs_fs_utimessync_path_atime_mtime)
    * [`fs.unlink(path, callback)`](http://nodejs.org/api/fs.html#fs_fs_unlink_path_callback)
    * [`fs.mkdir(path[, mode], callback)`](http://nodejs.org/api/fs.html#fs_fs_mkdir_path_mode_callback)
    * [`fs.readdir(path, callback)`](http://nodejs.org/api/fs.html#fs_fs_readdir_path_callback)
    * [`fs.readlink(path, callback)`](http://nodejs.org/api/fs.html#fs_fs_readlink_path_callback)
    * [`fs.symlink(srcpath, dstpath[, type], callback)`](http://nodejs.org/api/fs.html#fs_fs_symlink_srcpath_dstpath_type_callback)

Please open an issue if any bugs arise.  As always, I accept (working) pull requests, and refunds are available at `/dev/null`.
