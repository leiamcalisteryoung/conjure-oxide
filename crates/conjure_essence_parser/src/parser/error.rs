#![allow(clippy::legacy_numeric_constants)]

use tree_sitter::Node;
use super::util::named_children;

pub fn parse_error(node: Node, source_code: &str, messages: &mut Vec<String>) {
    let mut i = 0;
    for child_node in named_children(&node) {
        parse_error(child_node, source_code, messages);

        let x = node.field_name_for_named_child(i);
        i += 1;
        if x.is_some() {
            continue;
        }

        messages.push(format!("{}Invalid {}", get_line(child_node, source_code), prettify_kind(node.kind())));
        break;
    }
}

fn get_line(node: Node, source_code: &str) -> String {
    let line = node.start_position().row + 1;
    let character = node.start_position().column + 1;
    let text = source_code.lines().nth(line - 1).unwrap_or("Line not found");
    let pointer_line = format!(" |{}^", " ".repeat(character));
    format!("{}:{}:\n  |\n{} | {}\n{}\n", line, character, line, text, pointer_line)
}

fn prettify_kind(kind: &str) -> String {
    kind.replace("_", " ")
        .replace("expr", "expression")
        .replace("bool", "boolean")
        .replace("arith", "arithmetic")
        .replace("op", "operator")
}
