// Runtime functions
// const jsonr = require("@airportyh/jsonr");
const $history = [];
let $historyCursor = -1;
let $stack = [];
let $nextHeapId = 1;
let $heap = {};
let $body = $nativeDomToVDom(document.body);
let $heapOfLastDomSync = $heap;

function $pushFrame(funName, variables) {
    const newFrame = { funName, parameters: variables, variables };
    $stack = [...$stack, newFrame];
}

function $popFrame() {
    $stack = $stack.slice(0, $stack.length - 1);
}

function $setVariable(varName, value, line) {
    const frame = $stack[$stack.length - 1];
    const newFrame = {
        ...frame,
        variables: { ...frame.variables, [varName]: value }
    };
    $stack = [...$stack.slice(0, $stack.length - 1), newFrame];
}

function $heapAllocate(value) {
    const id = $nextHeapId;
    $nextHeapId++;
    $heap = {
        ...$heap,
        [id]: value
    };
    return id;
}

function $save(line) {
    $history.push({ line, stack: $stack, heap: $heap, body: $body });
    $historyCursor++;
}

function $getVariable(varName) {
    return $stack[$stack.length - 1].variables[varName];
}

function $heapAccess(id, heap) {
    if (!heap) {
        heap = $heap;
    }
    if (typeof id === "string") {
        return id;
    }
    return heap[id];
}

function $get(id, index) {
    if (typeof id === "string") {
        return id[index];
    }
    const object = $heap[id];
    return object[index];
}

function $set(id, index, value) {
    const object = $heap[id];
    let newObject;
    if (Array.isArray(object)) {
        newObject = object.slice();
        newObject[index] = value;
    } else {
        newObject = {
            ...$heap[id],
            [index]: value
        };
    }
    $heap = {
        ...$heap,
        [id]: newObject
    };
}

function $saveHistory(filePath) {
    require("fs").writeFile(
        filePath,
        jsonr.stringify($history, "	"),
        () => undefined
    );
}

// Built-in Functions:"
function range(...args) {
    let start, end;
    if (args.length === 1) {
        start = 0
        end = args[0];
    } else if (args.length === 2) {
        start = args[0];
        end = args[1];
    } else {
        throw new Error("Wrong number of arguments");
    }
    const ret = [];
    for (let i = start; i < end; i++) {
        ret.push(i);
    }
    return $heapAllocate(ret);
}

function split(string, separator) {
    return $heapAllocate(string.split(separator));
}

function print(...args) {
    console.log(...args);
}

function pop(arrayId) {
    return $heapAllocate($heap[arrayId].pop());
}

function push(arrayId, item) {
    const array = $heap[arrayId];
    const newArray = [...array, item];
    $heap = {
        ...$heap,
        [arrayId]: newArray
    };
    return newArray.length;
}

function concat(oneId, otherId) {
    const one = $heap[oneId];
    const other = $heap[otherId];
    return $heapAllocate(one.concat(other));
}

function map(fn, arrayId) {
    const arr = $heap[arrayId];
    return $heapAllocate(arr.map(fn));
}

function filter(fn, arrayId) {
    const arr = $heap[arrayId];
    return $heapAllocate(arr.filter(fn));
}

function reduce(fn, initValue, arrayId) {
    const arr = $heap[arrayId];
    return arr.reduce(fn, initValue);
}

function count(arrayId) {
    const arr = $heap[arrayId];
    return arr.length;
}

function sqrt(num) {
    return Math.sqrt(num);
}

function sqr(num) {
    return num * num;
}

function join(arrayId, separator) {
    const array = $heap[arrayId];
    return array.join(separator);
}

function floor(num) {
    return Math.floor(num);
}

function getElementById(id) {
    return document.getElementById(id);
}

function addStyle(element, stylesId) {
    const styles = $heap[stylesId];
    for (let prop in styles) {
        element.style[prop] = styles[prop];
    }
}

function $nativeDomToVDom(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        const element = { tag };
        const elementId = $heapAllocate(element);
        const attributeNames = node.getAttributeNames();
        if (attributeNames.length > 0) {
            const attrs = {};
            for (let i = 0; i < attributeNames.length; i++) {
                const attrName = attributeNames[i];
                attrs[attrName] = node.getAttribute(attrName);
            }
            element.attrs = $heapAllocate(attrs);
        }
        const childNodes = node.childNodes;
        if (childNodes.length > 0) {
            const childNodeResults = [];
            for (let i = 0; i < childNodes.length; i++) {
                childNodeResults[i] = $nativeDomToVDom(childNodes[i]);
            }
            element.children = $heapAllocate(childNodeResults);
        }
        return elementId;
    } else if (node.nodeType === Node.TEXT_NODE) {
        return node.data;
    } else {
        throw new Error("Unsupported node type: " + node.nodeType);
    }
}

function createElement(tag, attrs, children) {
    const element = { tag };
    if (attrs) {
        element.attrs = attrs;
    }
    if (children) {
        element.children = children;
    }
    return $heapAllocate(element);
}

function getDocumentBody() {
    return $body;
}

function appendTo(parentId, childId) {
    const parent = $heapAccess(parentId);
    const children = $heapAccess(parent.children) || [];
    const newChildren = $heapAllocate([...children, childId]);
    const newParent = {
        ...parent,
        children: newChildren
    };
    $heap = {
        ...$heap,
        [parentId]: newParent
    };
}

function setText(elementId, text) {
    const element = $heapAccess(elementId);
    const newChildren = $heapAllocate([text]);
    const newElement = {
        ...element,
        children: newChildren
    };
    $heap = {
        ...$heap,
        [elementId]: newElement
    };
}

function setStyle(elementId, stylesId) {
    const styles = $heapAccess(stylesId);
    const element = $heapAccess(elementId);
    const attrs = $heapAccess(element.attrs);
    const oldStyles = $heapAccess(attrs.style);
    const newAttrs = $heapAllocate({
        ...attrs,
        style: {
            ...oldStyles,
            ...styles
        }
    });
    const newElement = {
        ...element,
        attrs: newAttrs
    };
    $heap = {
        ...$heap,
        [elementId]: newElement
    };
}

function syncVDomToDom() {
    const diff = compare(1, $heapOfLastDomSync, 1, $heap);
    for (let i = 0; i < diff.length; i++) {
        const update = diff[i];
        mutateNativeDom(document.body, update);
    }
    $heapOfLastDomSync = $heap;

    function mutateNativeDom(element, update) {
        const { path, value } = update;
        if (path.length === 0) {
            throw new Error("Unexpected state, path elements should have been consumed.");
        }
        const [prop, ...restPath] = path;
        if (prop === "children") {
            const [idx, ...restRestPath] = restPath;
            if (restRestPath.length === 0) {
                if (update.type === "deletion") {
                    element.removeChild(element.childNodes[idx]);
                } else if (update.type === "addition") {
                    element.insertBefore($vdomToNativeDom(value), element.childNodes[idx]);
                } else if (update.type === "replacement") {
                    element.replaceChild($vdomToNativeDom(value), element.childNodes[idx]);
                } else {
                    throw new Error("Unknown update type: " + update.type);
                }
            } else {
                mutateNativeDom(element.childNodes[idx], {
                    type: update.type,
                    path: restRestPath,
                    value: value
                });
            }
        } else if (prop === "attrs") {
            if (restPath.length === 1) {
                const [prop] = restPath;
                $domSetAttrs(element, { [prop]: value });
            } else if (restPath.length === 0) {
                $domSetAttrs(element, value);
            } else {
                throw new Error("Not handling this case yet");
            }
        } else { // it's a number
            throw new Error("Not handling this case yet");
        }
    }
}

function $domSetAttrs(native, attrs) {
    if (attrs) {
        for (let key in attrs) {
            if (key === "style") {
                const styles = attrs.style;
                const styleStrings = [];
                for (let prop in styles) {
                    styleStrings.push(prop + ": " + styles[prop]);
                }
                native.setAttribute("style", styleStrings.join("; "));
            } else {
                native.setAttribute(key, attrs[key]);
            }
        }
    }
}

function $vdomToNativeDom(elementId) {
    const element = $heapAccess(elementId);
    if (typeof element === "string") {
        return document.createTextNode(element);
    } else {
        const native = document.createElement(element.tag);
        const attrs = $heapAccess(element.attrs);
        $domSetAttrs(native, attrs);
        const children = $heapAccess(element.children);
        if (children) {
            for (let i = 0; i < children.length; i++) {
                native.appendChild($vdomToNativeDom(children[i]));
            }
        }
        return native;
    }
}

function compare(source, heap1, destination, heap2) {
    return compareAt([], source, destination);

    function isObject(value) {
        const type = typeof value
        return value != null && (type === 'object' || type === 'function')
    }

    function difference(arr1, arr2) {
        const result = [];
        for (let i = 0; i < arr1.length; i++) {
            if (arr2.indexOf(arr1[i]) === -1) {
                result.push(arr1[i]);
            }
        }
        return result;
    }

    function intersection(arr1, arr2) {
        const result = [];
        for (let i = 0; i < arr1.length; i++) {
            if (arr2.indexOf(arr1[i]) !== -1) {
                result.push(arr1[i]);
            }
        }
        return result;
    }

    function compareAt(path, source, destination) {
        if (isObject($heapAccess(source, heap1)) && isObject($heapAccess(destination, heap2))) {
            return compareObjectsAt(path, source, destination);
        } else {
            if (source === destination) {
                return [];
            } else {
                return [
                    {
                        type: "replacement",
                        path: path,
                        oldValue: source,
                        value: destination
                    }
                ];
            }
        }
    }

    function compareObjectsAt(path, source, destination) {
        source = $heapAccess(source, heap1);
        destination = $heapAccess(destination, heap2);
        const sourceKeys = Object.keys(source);
        const destinationKeys = Object.keys(destination);
        const sourceOnlyKeys = difference(sourceKeys, destinationKeys);
        const commonKeys = intersection(sourceKeys, destinationKeys);
        const destinationOnlyKeys = difference(destinationKeys, sourceKeys);
        const additions = destinationOnlyKeys.map((key) => ({
            type: "addition",
            path: [...path, key],
            value: destination[key]
        }));
        const removals = sourceOnlyKeys.map((key) => ({
            type: "deletion",
            path: [...path, key]
        }));

        const childDiffs = commonKeys
            .reduce((diffs, key) => {
                const result = compareAt([...path, key], source[key], destination[key]);
                return [
                    ...result,
                    ...diffs
                ];
            }, []);
        return [
            ...additions,
            ...removals,
            ...childDiffs
        ];
    }

}

function createDebugUI() {
    // Debugger UI Container
    const ui = document.createElement("div");
    ui.style.position = "fixed";
    ui.style.bottom = "0px";
    ui.style.left = "0px";
    ui.style.right = "0px";
    ui.style.height = "4em";
    ui.style.backgroundColor = "#ededed";
    ui.style.padding = "0.5em";
    ui.style.borderTop = "#888 solid 1px";

    // Prev Button
    const prevButton = document.createElement("button");
    prevButton.textContent = "←";//→
    prevButton.addEventListener("click", () => {
        if ($historyCursor - 1 >= 0) {
            $historyCursor = $historyCursor - 1;
            syncAll();
        }
    });
    ui.appendChild(prevButton);
    ui.appendChild(document.createTextNode(" "));

    // Progress label
    const progress = document.createElement("label");
    syncProgress();
    function syncProgress() {
        const total = $history.length;
        const current = $historyCursor + 1;
        const labelText = `Step ${current} of ${total}`;
        progress.textContent = labelText;
    }
    ui.appendChild(progress);
    ui.appendChild(document.createTextNode(" "));

    // Next Button
    const nextButton = document.createElement("button");
    nextButton.textContent = "→";
    nextButton.addEventListener("click", () => {
        if ($historyCursor + 1 < $history.length) {
            $historyCursor = $historyCursor + 1;
            syncAll();
        }
    });
    ui.appendChild(nextButton);
    ui.appendChild(document.createElement("br"));

    // Slider "Range" Element
    const range = document.createElement("input");
    range.style.width = "100%";
    range.type = "range";
    range.min = 1;
    syncRange();
    range.addEventListener("change", (e) => {
        $historyCursor = range.value - 1;
        syncAll();
    });
    function syncRange() {
        range.max = $history.length;
    }
    function syncRangeValue() {
        range.value = $historyCursor + 1;
    }
    ui.appendChild(range);

    document.documentElement.appendChild(ui);

    function syncProgramState() {
        let state = $history[$historyCursor];
        $stack = state.stack;
        $heap = state.heap;
        $body = state.body;
    }

    function syncAll() {
        syncRangeValue();
        syncProgramState();
        syncProgress();
        syncVDomToDom();
    }

}


async function main() {
    var $immediateReturnValue;
    $pushFrame("main", {  });
    try {
        $save(2);
        $setVariable("button", createElement("button", $heapAllocate({ style: $heapAllocate({ color: "red" }) }), $heapAllocate(["Hello, world!"])), 2);
        $save(3);
        $setVariable("div", createElement("div", $heapAllocate({ class: "panel" }), $heapAllocate([$getVariable("button")])), 3);
        $save(4);
        $setVariable("body", getDocumentBody(), 4);
        $save(5);
        appendTo($getVariable("body"), $getVariable("div"));
        $save(6);
        setText($getVariable("button"), "Hello, Jacki!");
        $save(7);
        setStyle($getVariable("button"), $heapAllocate({ color: "orange" }));
        $save(8);
        syncVDomToDom();
        $save(10);
        setStyle($getVariable("button"), $heapAllocate({ color: "cyan" }));
        $save(11);
        syncVDomToDom();
    } finally {
        $save(12);
        $popFrame();
    }
}

main().catch(err => console.log(err.stack))

createDebugUI();