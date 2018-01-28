# rpntool
Optional assignment for Algorithms and Data Structures I. lecture (ELTE-IK; semester 2015-16/1)

Demo uploaded here: http://people.inf.elte.hu/keszeiabel/algo1/bead/

## Infix to RPN
Validates and converts infix expressions into postfix (Reverse-Polish) notation. The process of the conversion can be executed at a slower speed, making visible what's going on in the background. In this case, a visualization of the background stack will be visible. There is also a log available, where the steps of the conversion are visible. The converted expression can be copied to the evalution tool using a button if it contains no letters.

Accepts the following operators:
* addition (+)
* subtraction (-)
* multiplication (*)
* division (/)
* factorial (!)

Numbers and letters of the English alphabet should be used as operands. No spaces allowed.

## Evaluation of RPN
It is also possible to evaluate an expression given in postfix. Just like the previous tool, this one can also be visualized at a slower speed, making the stack used by the algorithm visible. A log for the evaluation is available as well.

Accepts the same operators as the converter, but only accepts numbers. (You cannot evaluate letters, duh.) Using spaces is obligatory here.

## Source code
The last option of the menu is where viewing the source code is possible. (Created because project wasn't previously uploaded to GitHub.)
