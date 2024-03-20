importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js')

async function initialize() {
    // console.log("Initializing Pyodide...");
    if (self.pyodide === undefined) {
        self.pyodide = await loadPyodide();
        await loadPackage('numpy')
        await loadPackage('https://quim0.github.io/rvcat-web-ui/rvcat-0.1-py3-none-any.whl')
    }
}

async function loadPackage(package) {
    await self.pyodide.loadPackage(package);
}

self.onmessage = async function(message) {
    console.log('Message received from main thread', message)
    if (message.data.action === 'initialize') {
        await initialize();
        // Respond message
        self.postMessage({action: 'initialized'});
    }
    if (message.data.action === 'loadPackage') {
        await loadPackage(message.data.package);
        self.postMessage({action: 'loadedPackage', package: message.data.package});
    }
    if (message.data.action === 'execute') {
        // catch python errors
        try {
            let res = await self.pyodide.runPythonAsync(message.data.code);
            console.log('Result:', res);
            if (message.data.id !== undefined) {
                self.postMessage({action: 'executed', result: res, data_type: 'text', id: message.data.id});
            } else {
                self.postMessage({action: 'executed', result: res, data_type: 'text'});
            }
        } catch (err) {
            if (message.data.id !== undefined) {
                self.postMessage({action: 'executed', result: err.toString(), data_type: 'error', id: message.data.id});
            }
            else {
                self.postMessage({action: 'executed', result: err.toString(), data_type: 'error'});
            }
        }
        //let res = await self.pyodide.runPythonAsync(message.data.code);
        //console.log('Result:', res);
        //self.postMessage({action: 'rendered', result: res, data_type: 'png'});
    }
}