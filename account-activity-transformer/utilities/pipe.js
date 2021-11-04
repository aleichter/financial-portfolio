const _pipe = (...fns) => {
    return (arg) => fns.reduce((prev, fn) => fn(prev), arg);
}

exports.pipe = _pipe;

exports.pipeWith  = (arg, ...fns) => {
    return _pipe(...fns)(arg);
}