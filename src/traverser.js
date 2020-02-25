exports.traverseAndCollect = function traverseAndCollect(node, visit) {
    const result = visit(node);
    if (result) {
        return result;
    }

    if (node.type === "binary_operation") {
        return [
            ...traverseAndCollect(node.left, visit),
            ...traverseAndCollect(node.right, visit)
        ];
    } else if (node.type === "boolean_literal") {
        return [];
    } else if (node.type === "call_expression") {
        const result = [];
        for (let arg of node.arguments) {
            result.push(...traverseAndCollect(arg, visit));
        }
        return result;
    } else if (node.type === "code_block") {
        const result = [];
        for (let statement of node.statements) {
            result.push(...traverseAndCollect(statement, visit));
        }
        return result;
    } else if (node.type === "comment") {
        return [];
    } else if (node.type === "dictionary_literal") {
        const result = [];
        for (let entry of node.entries) {
            result.push(...traverseAndCollect(entry[0], visit));
            result.push(...traverseAndCollect(entry[1], visit));
        }
        return result;
    } else if (node.type === "for_loop") {
        return [
            ...traverseAndCollect(node.iterable, visit),
            ...traverseAndCollect(node.body, visit)
        ];
    } else if (
        node.type === "function_definition" ||
        node.type === "function_expression") {
        return traverseAndCollect(node.body, visit);
    } else if (node.type === "identifier") {
        return [];
    } else if (node.type === "if_statement") {
        const conditionClosures = traverseAndCollect(node.condition, visit);
        const consequentClosures = traverseAndCollect(node.consequent, visit);
        const alternateClosures =
            node.alternate &&
            traverseAndCollect(node.alternate, visit) ||
            [];
        return [
            ...conditionClosures,
            ...consequentClosures,
            ...alternateClosures
        ];
    } else if (node.type === "indexed_access") {
        return [
            ...traverseAndCollect(node.subject, visit),
            ...traverseAndCollect(node.index, visit)
        ];
    } else if (node.type === "indexed_assignment") {
        return [
            ...traverseAndCollect(node.subject, visit),
            ...traverseAndCollect(node.index, visit),
            ...traverseAndCollect(node.value, visit)
        ];
    } else if (node.type === "list_literal") {
        const result = [];
        for (let item of node.items) {
            result.push(...traverseAndCollect(item, visit));
        }
        return result;
    } else if (node.type === "number_literal") {
        return [];
    } else if (node.type === "string_literal") {
        return [];
    } else if (node.type === "return_statement") {
        return traverseAndCollect(node.value, visit);
    } else if (node.type === "var_assignment") {
        return traverseAndCollect(node.value, visit);
    } else if (node.type === "var_reference") {
        return [];
    } else if (node.type === "while_loop") {
        return [
            ...traverseAndCollect(node.condition, visit),
            ...traverseAndCollect(node.body, visit)
        ];
    } else {
        console.log("node", node);
        throw new Error("Unhandled node type: " + node.type);
    }
}
