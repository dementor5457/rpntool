/*
* Algoritmusok és adatszerkezetek 1. (ELTE-IK)
* Szorgalmi beadandó feladat
* Infix kifejezés lengyel formára hozása, majd annak kiértékelése
* Szemléltetés webes felületen, lassítható végrehajtással
*
* Készítette: Keszei Ábel
* Utolsó módosítás: 2015. 10. 28.
*
* Felhasznált eszközök:
* - jQuery: https://jquery.com/
* - Bootstrap: http://getbootstrap.com/
* - highlight.js: https://highlightjs.org/
*/

// Dokumentum betöltődésekor szükséges lépések elvégzése
$(document).ready(function() {
    $("#infInput").val("");
    $("#pfInput").val("");
    $("#submit").attr("disabled", "disabled");
    $("#eval_submit").attr("disabled", "disabled");
    
    if ($("#cb_timeout").is(":checked"))
        $("#stack").css("display", "block");
    else
        $("#stack").css("display", "none");
        
    if ($("#cb_eval_timeout").is(":checked"))
        $("#eval_stack").css("display", "block");
    else
        $("#eval_stack").css("display", "none");
});

// A konvertáló input mezőjének eseménye ENTER gombra
$('#infInput').on('keypress', function(event) {
    if (event.which == 13) {
        if ($("#submit").attr("disabled") != "disabled")
        convert();
    }    
});

// A kiértékelő input mezőjének eseménye ENTER gombra
$('#pfInput').on('keypress', function(event) {
    if (event.which == 13) {
        if ($("#eval_submit").attr("disabled") != "disabled")
        evalPf();
    }    
});

// Verem típus megvalósítása
var Stack = function(){
    this._top = null;
    this.size = 0;
};

var Node = function(data){
    this.data = data;
    this.previous = null;
};

Stack.prototype.push = function(data) {
    var node = new Node(data);
    
    node.previous = this._top;
    this._top = node;
    this.size++;
    return this._top;
};

Stack.prototype.pop = function() {
    temp = this._top.data;
    this._top = this._top.previous;
    this.size--;
    return temp;
};

Stack.prototype.top = function() {
    return this._top == null ? null : this._top.data;
};

Stack.prototype.isEmpty = function() {
    return this.size == 0;
};

// Lap váltása
function show(id) {
    $.each(["polishn", "eval", "src"], function(i, v) {
        $("#" + v).css("display", id == v ? "block" : "none");
        id == v ? $("#li_" + v).addClass("active") : $("#li_" + v).removeClass("active");
    });
}

// Elemek láthatóságának ki/bekapcsolása
function toggle(id) {
    $("#" + id).css("display", $("#" + id).css("display") == "none" ? "block" : "none");
}

// Infix kifejezés formátumának ellenőrzése
function validateInfixNotation() {
    var infn = $("#infInput").val();
    
    // A zárójelezés helyességén kívül a formátum ellenőrzése
    var pattern = /^\(*([a-z]|[1-9]+[0-9]*|0)\)*!?(\)+!?)*(([\+\-\*\/])\(*([a-z]|[1-9]+[0-9]*|0)\)*!?(\)+!?)*)*$/i;
    if (!pattern.test(infn)) {
        $("#infGrp").addClass("has-error");
        $("#submit").attr("disabled", "disabled");
        return;
    }

    // Zárójelezés ellenőrzése
    // (rossz, ha nem 0 a nyitó és csukó zárójelek különbsége, illetve ha nem nyitó zárójel az első zárójel)
    var leftBrackets = (infn.match(/\(/g) || []).length;
    var rightBrackets = (infn.match(/\)/g) || []).length;
    
    if (leftBrackets + rightBrackets != 0) {
        var firstBracket = "";
        for (var i = 0; i < infn.length; i++) {
            if (infn[i] == "(" || infn[i] == ")") {
                firstBracket = infn[i];
                break;
            }
        }
        if (leftBrackets != rightBrackets || firstBracket != "(") {
            $("#infGrp").addClass("has-error");
            $("#submit").attr("disabled", "disabled");
            return;
        }
    }
    
    $("#infGrp").removeClass("has-error");
    $("#submit").removeAttr("disabled");
}

// Karakter operátor voltának eldöntése
function isOperator(char) {
    return ["-", "+", "/", "*", "!", "^"].indexOf(char) != -1;
}

// Karakter operandus voltának eldöntése
function isOperand(char) {
    return /^([a-z]|[1-9]+[0-9]*|0){1}$/i.test(char);
}

// Karakter numerikus operandus voltának eldöntése
function isNumericOperand(char) {
    return /^([1-9]+[0-9]*|0){1}$/i.test(char);
}

// Precedencia függvény
function precedenceOf(char) {
    switch (char) {
        case "-":
        case "+":
            return 0;
        case "/":
        case "*":
            return 1;
        case "!":
            return 2;
    }
}

// Lépésszámláló és az időzítések tárolója a konvertálóhoz
// (a követhető sebességű végrehajtáshoz kellenek)
var counter = 0;
var timeouts = [];

// Formátumhelyes infix formula konvertálása lengyel formára
function convert() {
    counter = 0;
    $.each(timeouts, function(i, v) {
        clearTimeout(v);
    });
    
    // Dolgok alaphelyzetbe rakása + kifejezés kivétele a beviteli mezőből
    var infn = $("#infInput").val();
    $("#ta_steps").html("");
    $("#postfix").val("");
    $("#output").css("display", "block");
    $("#div_stack_cont").empty();
    
    // Ha csak számokból áll a kifejezés, megjelenítjük a másolás gombot alul
    $("#evalBtn").css("display", (/^([0-9]|[\+\-\*\/\!\(\)])+$/i.test($("#infInput").val())) ? "block" : "none");

    // Tokenek előállítása (az egymás melletti számokat egynek veszi)
    var tokens = [];
    var tmp = "";
    $.each(infn.split(""), function(i, v) {
        if (/^[0-9]$/.test(v)) {
            tmp += v;
        } else {
            if (tmp != "") {
                tokens.push(tmp);
                tmp = "";
            }
            tokens.push(v);
        }
    });
    if (tmp != "")
        tokens.push(tmp);
    
    // Verem inicializálása és a fő algorimus végrehajtása
    var stack = new Stack();
    $.each(tokens, function(i, v) {
        if (isOperand(v)) {
            out(v, false);
            logStep("'" + v + "' operandus, kiírva a kimenetre", true);
        } else if (v == "(") {
            logStep("'" + v + "' nyitó zárójel, Push a verembe", false);
            visualStackPush(v, true);
            stack.push(v);
        } else if (v == ")") {
            logStep("'" + v + "' csukó zárójel, nyitó pár keresése a veremben:", false);
            visualStackPop(false);
            var x = stack.pop();
            while (x != "(") {
                out(x, true);
                logStep("  '" + x + "' volt a verem tetején, kiírva a kimenere", true);
                visualStackPop(false);
                x = stack.pop();
            }
            logStep("  '" + x + "' nyitó zárójel megtalálva", true);
        } else if (isOperator(v)) {
            logStep("'" + v + "' operátor, erősebb precedenciájú operátorok keresése a veremben:", false);
            while (!stack.isEmpty() && precedenceOf(v) <= precedenceOf(stack.top()) && stack.top() != "(") {
                visualStackPop(false);
                var x = stack.pop();
                out(x, true);
                logStep("  '" + x + "' operátor volt a verem tetején, kiírva a kimenetre", true);
            }
            
            logStep("  '" + v + "' Push a verembe (nincs több erősebb precedenciájú operátor)", false);
            visualStackPush(v, true);
            stack.push(v);
        }
    });

    if (!stack.isEmpty())
        logStep("Maradék operátorok kivétele a veremből:", false);
    while (!stack.isEmpty()) {
        visualStackPop(false);
        var x = stack.pop();
        out(x, true);
        logStep("  '" + x + "' operátor kiírva a kimenetre", true);
    }

    logStep("Feldolgozás vége", false);
}

// Időzítő eljárások: ezek végzik a lassítatlan végrehajtást is, ilyenkor 0 időzítéssel

// Időzítés a konvertálóhoz
function timeout(noDelay, f) {
    if (!noDelay)
        counter++;
    timeouts.push(setTimeout(f, counter * ($("#cb_timeout").is(":checked") ? 1200 : 0)));
}

// A verem grafikus reprezentációján végez Push műveletet időzítve (konvertáló)
function visualStackPush(txt, noDelay) {
    timeout(noDelay, function() {
        $("#div_stack_cont").prepend('<div class="stack_node">' + txt + '</div>');
        $("#div_stack_cont").animate({ scrollTop: 0 }, "fast");
    });
}

// A verem grafikus reprezentációján végez Pop műveletet időzítve (konvertáló)
function visualStackPop(noDelay) {
    timeout(noDelay, function() {
        $('#div_stack_cont').find('div').first().remove();
    });
}

// A kimenetre ír, időzítve (konvertáló)
function out(txt, noDelay) {
    timeout(noDelay, function() {
        if ($("#postfix").val() != "")
            $("#postfix").val($("#postfix").val() + " ");
        $("#postfix").val($("#postfix").val() + txt);
    });
}

// Feljegyez egy megoldási lépést, időzítve (konvertáló)
function logStep(txt, noDelay) {
    timeout(noDelay, function() {
        if ($("#ta_steps").val() != "")
            $("#ta_steps").append("\n");
        $("#ta_steps").append(txt);
        $('#ta_steps').scrollTop($('#ta_steps')[0].scrollHeight);
    });
}

// Az infixről lengyel formára konvertált kifejezést a kiértékelőbe másolja, majd megjeleníti azt
function copyPostfix() {
    $("#pfInput").val($("#postfix").val());
    $("#pfGrp").removeClass("has-error");
    $("#eval_submit").removeAttr("disabled");
    
    show("eval");
}

// Lengyel formás kifejezés formátumának ellenőrzése
function validatePostfixNotation() {
    var pf = $("#pfInput").val();
    
    /* 
    * Ha a számláló bármikor 0 alá megy, a kifejezés érvénytelen
    * Bináris operátor: 2-t csökkent, 1-et hozzáad
    * Unáris operátor: 1-et csökkent, 1-et hozzáad
    * Szám: 1-et hozzáad
    * Nem szám és nem operandus: a kifejezés érvénytelen
    */ 
    var counter = 0;
    var aboveZeroAndNotNaN = true;
    $.each(pf.split(" "), function(i, v) {
        if (isOperator(v) && v != "!") {
            counter--;
            if (counter < 0) {
                aboveZeroAndNotNaN = false;
                return false; // break
            }
            counter--;
            if (counter < 0) {
                aboveZeroAndNotNaN = false;
                return false; // break
            }
            counter++;
        } else if (v == "!") {
            counter--;
            if (counter < 0) {
                aboveZeroAndNotNaN = false;
                return false; // break
            }
            counter++;
        } else if (isNumericOperand(v)) {
            counter++;
        } else {
            aboveZeroAndNotNaN = false;
            return false;
        }
    });

    // Ha nem mentünk nulla alá és minden karakter helyes volt, még rossz lehet, ha nem 1 a számláló
    var isValid = false;
    if (aboveZeroAndNotNaN)
        isValid = counter == 1;
    
    if (isValid) {
        $("#pfGrp").removeClass("has-error");
        $("#eval_submit").removeAttr("disabled");
    } else {
        $("#pfGrp").addClass("has-error");
        $("#eval_submit").attr("disabled", "disabled");
    }
}

// Lépésszámláló és az időzítések tárolója a kiértékelőhöz
// (a követhető sebességű végrehajtáshoz kellenek)
var eval_counter = 0;
var eval_timeouts = [];

// Formátumhelyes lengyel formás kifejezés kiértékelése
function evalPf() {
    eval_counter = 0;
    $.each(eval_timeouts, function(i, v) {
        clearTimeout(v);
    });
    
    var pf = $("#pfInput").val();
    $("#eval_ta_steps").html("");
    $("#result").val("");
    $("#eval_output").css("display", "block");
    $("#div_stack_eval_cont").empty();
    
    // Verem inicializálása és a fő algorimus végrehajtása
    var stack = new Stack();
    $.each(pf.split(" "), function(i, v) {
        if (isOperand(v)) {
            eval_logStep("'" + v + "' operandus, Push a verembe", false);
            eval_visualStackPush(v, true);
            stack.push(v);
        } else if (isOperator(v)) {
            if (v == "!") {
                eval_logStep("'" + v + "' unáris operátor, elvégzés a legfelső elemen:", false);
                eval_visualStackPop(true);
                var val = parseInt(stack.pop());
                var res = fact(val);
                eval_logStep("  '" + val + "'" + v + " = " + res + ", Push a verembe", false);
                eval_visualStackPush(res, true);
                stack.push(res);
            } else {
                eval_logStep("'" + v + "' bináris operátor, elvégzés a két legfelső elemen:", false);
                eval_visualStackPop(false);
                eval_visualStackPop(true);
                var val1 = parseInt(stack.pop());
                var val2 = parseInt(stack.pop());
                switch (v) {
                    case "+":
                        var res = val2 + val1;
                        break;
                    case "-":
                        var res = val2 - val1;
                        break;
                    case "*":
                        var res = val2 * val1;
                        break;    
                    case "/":
                        var res = val2 / val1;
                        break;
                }
                eval_logStep("  '" + val2 + "' " + v + " '" + val1 + "' = " + res, true);
                eval_logStep("  '" + res + "' Push a verembe", false);
                eval_visualStackPush(res, true);
                stack.push(res);
            }
        }
    });
    
    eval_logStep("Feldolgozás vége, eredmény kivétele a veremből", false);
    eval_visualStackPop(true);
    eval_timeout(true, function() {
        $("#result").val(stack.pop());
    });
}

// Időzítő eljárások: ezek végzik a lassítatlan végrehajtást is, ilyenkor 0 időzítéssel

// Időzítés a kiértékelőhöz
function eval_timeout(noDelay, f) {
    if (!noDelay)
        eval_counter++;
    eval_timeouts.push(setTimeout(f, eval_counter * ($("#cb_eval_timeout").is(":checked") ? 1200 : 0)));
}

// Feljegyez egy megoldási lépést, időzítve (kiértékelő)
function eval_logStep(txt, noDelay) {
    eval_timeout(noDelay, function() {
        if ($("#eval_ta_steps").val() != "")
            $("#eval_ta_steps").append("\n");
        $("#eval_ta_steps").append(txt);
        $('#eval_ta_steps').scrollTop($('#eval_ta_steps')[0].scrollHeight);
    });
}

// A verem grafikus reprezentációján végez Push műveletet időzítve (kiértékelő)
function eval_visualStackPush(txt, noDelay) {
    eval_timeout(noDelay, function() {
        $("#div_stack_eval_cont").prepend('<div class="stack_node">' + txt + '</div>');
        $("#div_stack_eval_cont").animate({ scrollTop: 0 }, "fast");
    });
}

// A verem grafikus reprezentációján végez Pop műveletet időzítve (kiértékelő)
function eval_visualStackPop(noDelay) {
    eval_timeout(noDelay, function() {
        $('#div_stack_eval_cont').find('div').first().remove();
    });
}

// Faktoriális kiszámítása
function fact(n) {
    var ret = 1;
    for (var i = 2; i <= n; i++)
        ret *= i;
    return ret;
}