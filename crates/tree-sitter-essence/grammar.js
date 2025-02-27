module.exports = grammar({
  name: 'essence',

  extras: $ => [
    $.single_line_comment,
    /\s/,
    $.language_label
  ],

  rules: {
    //top level statements
    program: $ => repeat(choice(
      $.find_statement_list,
      $.constraint_list,
      $.letting_statement_list,
      $.dominance_relation
    )),

    single_line_comment: $ => token(seq('$', /.*/)),
    language_label: $ => token(seq("language", /.*/)),

    // Basic components
    constant: $ => choice($.integer, $.TRUE, $.FALSE),
    integer: $ => /[0-9]+/,
    TRUE: $ => "true",
    FALSE: $ => "false",
    variable: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // Find statements
    find_statement_list: $ => seq("find", repeat($.find_statement)),
    find_statement: $ => seq($.variable_list, ":", $.domain, optional(",")),
    variable_list: $ => seq($.variable, optional(repeat(seq(",", $.variable)))),
    domain: $ => choice($.bool_domain, $.int_domain, $.variable),
    bool_domain: $ => "bool",

    int_domain: $ => prec.left(seq(
      "int",
      optional(seq(
        "(",
        $.range_list,
        //TODO: eventually add in expressions here
        ")"
      ))
    )),

    range_list: $ => prec(2, seq(
      choice(
        $.int_range,
        $.integer
      ),
      optional(repeat(seq(
        ",",
        choice(
          $.int_range,
          $.integer
        ),
      )))
    )),

    int_range: $ => seq(optional($.expression), "..", optional($.expression)),

    // Letting statements
    letting_statement_list: $ => seq("letting", repeat($.letting_statement)),
    letting_statement: $ => seq($.variable_list, "be", choice($.expression, seq("domain", $.domain))),

    // Constraints
    constraint_list: $ => seq("such that", $.expression, optional(repeat(seq(",", $.expression))), optional(",")),

    // Expression hierarchy
    expression: $ => choice($.boolean_expr, $.comparison_expr, $.arithmetic_expr),
    
    boolean_expr: $ => choice(
      $.not_expr,
      $.and_expr,
      $.or_expr,
      $.implication,
      $.quantifier_expr,
      $.from_solution
    ),

    not_expr: $ => prec(20, seq("!", choice($.boolean_expr, $.comparison_expr, $.primary_expr))),
    
    and_expr: $ => prec(-1, prec.left(seq(choice($.boolean_expr, $.comparison_expr, $.primary_expr), "/\\", choice($.boolean_expr, $.comparison_expr, $.primary_expr)))),
    
    or_expr: $ => prec(-2, prec.left(seq(choice($.boolean_expr, $.comparison_expr, $.primary_expr), "\\/", choice($.boolean_expr, $.comparison_expr, $.primary_expr)))),
    
    implication: $ => prec(-4, prec.left(seq(choice($.boolean_expr, $.comparison_expr, $.primary_expr), "->", choice($.boolean_expr, $.comparison_expr, $.primary_expr)))),

    quantifier_expr: $ => prec(-10, seq(
      choice("and", "or", "min", "max", "sum", "allDiff"),
      "([",
      repeat(seq($.expression, optional(","))),
      "])"
    )),

    from_solution: $ => seq(
      "fromSolution",
      "(",
      $.variable,
      ")"
    ),

    comparison_expr: $ => prec(0, prec.left(seq(
      choice($.boolean_expr, $.arithmetic_expr), 
      $.comparative_op,
      choice($.boolean_expr, $.arithmetic_expr)
    ))),

    comparative_op: $ => choice("=", "!=", "<=", ">=", "<", ">"),

    arithmetic_expr: $ => choice(
      $.primary_expr,
      $.negative_expr,
      $.abs_value,
      $.exponent,
      $.product_expr,
      $.sum_expr
    ),

    primary_expr: $ => choice(
      $.sub_expr,
      $.constant,
      $.variable
    ),

    sub_expr: $ => seq("(", $.expression, ")"),

    negative_expr: $ => prec(15, prec.left(seq("-", $.arithmetic_expr))),
    
    abs_value: $ => prec(20, seq("|", $.arithmetic_expr, "|")),
    
    exponent: $ => prec(18, prec.right(seq($.arithmetic_expr, "**", $.arithmetic_expr))),

    product_expr: $ => prec(10, prec.left(seq($.arithmetic_expr, $.mulitcative_op, $.arithmetic_expr))),
    
    mulitcative_op: $ => choice("*", "/", "%"),
    
    sum_expr: $ => prec(1, prec.left(seq($.arithmetic_expr, $.additive_op, $.arithmetic_expr))),
    
    additive_op: $ => choice("+", "-"),

    dominance_relation: $ => seq(
      "dominanceRelation",
      $.expression
    )
  }
})
