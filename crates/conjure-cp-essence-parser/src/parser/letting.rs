#![allow(clippy::legacy_numeric_constants)]
use std::collections::BTreeSet;

use tree_sitter::Node;

use super::domain::parse_domain;
use super::util::named_children;
use crate::errors::EssenceParseError;
use crate::expression::parse_expression;
use conjure_cp_core::ast::DeclarationPtr;
use conjure_cp_core::ast::{Name, SymbolTable};

/// Parse a letting statement into a SymbolTable containing the declared symbols
pub fn parse_letting_statement(
    letting_statement: Node,
    source_code: &str,
) -> Result<SymbolTable, EssenceParseError> {
    let mut symbol_table = SymbolTable::new();

    let mut temp_symbols = BTreeSet::new();

        let variable_list = letting_statement.child(0).expect("No variable list found");
        for variable in named_children(&variable_list) {
            let variable_name = &source_code[variable.start_byte()..variable.end_byte()];
            temp_symbols.insert(variable_name);
        }

        let expr_or_domain = letting_statement
            .named_child(1)
            .expect("No domain or expression found for letting statement");
        match expr_or_domain.kind() {
            "expression" => {
                for name in temp_symbols {
                    symbol_table.insert(DeclarationPtr::new_value_letting(
                        Name::user(name),
                        parse_expression(
                            expr_or_domain,
                            source_code,
                            &letting_statement_list,
                            Some(&symbol_table),
                        )?,
                    ));
                }
            }
            "domain" => {
                for name in temp_symbols {
                    symbol_table.insert(DeclarationPtr::new_domain_letting(
                        Name::user(name),
                        parse_domain(expr_or_domain, source_code),
                    ));
                }
            }
            _ => panic!("Unrecognized node in letting statement"),
        }
    }

    let expr_or_domain = letting_statement
        .child_by_field_name("expr_or_domain")
        .expect("No domain or expression found for letting statement");
    match expr_or_domain.kind() {
        "bool_expr" | "arithmetic_expr" => {
            for name in temp_symbols {
                symbol_table.insert(Rc::new(Declaration::new_value_letting(
                    Name::UserName(String::from(name)),
                    parse_expression(expr_or_domain, source_code, &letting_statement)?,
                )));
            }
        }
        "domain" => {
            // let domain = expr_or_domain.next_sibling().expect("No domain found in letting statement");
            for name in temp_symbols {
                symbol_table.insert(Rc::new(Declaration::new_domain_letting(
                    Name::UserName(String::from(name)),
                    parse_domain(expr_or_domain, source_code),
                )));
            }
        }
        _ => panic!("Unrecognized node in letting statement"),
    }

    Ok(symbol_table)
}
