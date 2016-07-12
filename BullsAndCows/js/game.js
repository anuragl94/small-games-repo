$(document).ready(function () {
    var selectedWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
    var guessedWords = [];
    var pressedKeys = [];
    var global = {settings: null};
    global.settings = {
        autoScratch: false,
        apiUrl: "https://dictionary.yandex.net/api/v1/dicservice.json/lookup",
        apiKey: "dict.1.1.20160518T071458Z.92744e8fbf915bea.3a1b0f1dedde34717b4098338fee5a9300119736"
    };

    // Here is a dictionary API key for this particular game
    // dict.1.1.20160518T071458Z.92744e8fbf915bea.3a1b0f1dedde34717b4098338fee5a9300119736
    // from https://tech.yandex.com

    // Populate the scratch area
    for (var i = 65; i <= 90; i += 1) {
        $(".scratchArea").append('<div class="scratchItem" data-token=' + String.fromCharCode(i) + '>' + String.fromCharCode(i) + '</div>');
    }

    function getNewWordField(addSpace) {
        addSpace = addSpace || false;
        if (addSpace === true) {
            $(".gameArea").append('<div class="mb"></div>');
        }
        var newField = $(".template .wordInput").clone();
        $(".gameArea").append(newField);
        $(newField).find(".letterInput:first").focus();
        return newField;
    }

    function validateGuess(word) {
        // Check for invalid characters
        for (var i = 0; i < word.length; i += 1) {
            if (!((word[i].toUpperCase() >= "A") && (word[i].toUpperCase() <= "Z"))) {
                return {
                    title: "Uhh...",
                    message: "Special characters are not allowed"
                };
            }
        }
        // Check for word length
        if (word.length !== 4) {
            return {
                title: "Yikes!",
                message: "A word has to be 4 characters long"
            };
        }
        // Check for duplicate characters
        var sortedWord = word.split("").sort();
        for (var i = 0; i < sortedWord.length - 1; i += 1) {
            if (sortedWord[i] === sortedWord[i + 1]) {
                return {
                    title: "Hmmm...",
                    message: "Alphabets cannot be repeated"
                };
            }
        }
        // Check if word belongs to dictionary. May need Google APIs
        // This logic won't work as it's an asynchronous call. This function will return true before we get a response from the API
        var isInDict = true;
        $.getJSON(global.settings.apiUrl + "?key=" + global.settings.apiKey + "&lang=en-en&text=" + word, function (response) {
            if (response.def.length === 0) {
                isInDict = false;
            }
        })
        // Lastly, check if word was already guessed
        if ($.inArray(word, guessedWords) !== -1) {
            return {
                title: "Hey!",
                message: "You've already guessed that"
            };
        }
        return true; // All is well
    }

    function evaluateGuess(word) {
        var bulls = 0, cows = 0;
        for (var i = 0; i < 4; i += 1) {
            if (word[i] === selectedWord[i]) {
                bulls += 1;
            } else {
                for (var j = i + 1; j < 4 + i; j += 1) {
                    if (word[i] === selectedWord[j % 4]) {
                        cows += 1;
                    }
                }
            }
        }
        return {
            bulls: bulls,
            cows: cows
        };
    }

    getNewWordField();

    $(".gameArea").on("keydown", "input", function (e) {
        var key = e.keyCode.toString();
        var index = $(this).index();
        var parent = $(this).parent();
        pressedKeys.push(key);
        //The following keys, if pressed override preventDefault
        // 16=shift, 17=ctrl, 18=alt
        var globalKeys = [17, 18];
        var exit = false;
        $.each(globalKeys, function () {
            if ($.inArray(this.toString(), pressedKeys) > -1) {
                exit = true;
                return;
            }
        });
        if (exit === true) {
            return;
        }
        if ((key >= 65 && key <= 90) || (key >= 97 && key <= 122)) {
            //Alphabets
            e.preventDefault();
            if (index < 4) {
                var character = String.fromCharCode(key).toUpperCase();
                this.value = character;
                var nextInput = $(parent).find("input")[index + 1];
                $(nextInput).focus();
            }
        } else
        if (key == 8) {
            //Backspace
            e.preventDefault();
            if (index < 4) {
                this.value = "";
            }
            if (index > 0) {
                var prevInput = $(parent).find("input")[index - 1];
                $(prevInput).focus();
            }
        }

    });

    $(window).on("keyup", function (e) {
        var key = e.keyCode.toString();
        var index = pressedKeys.indexOf(key);
        if (index > -1) {
            pressedKeys.splice(index, 1);
        }
    });

    $(".gameArea").on("click", ".checkWord", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var inputFields = $(this).parent().find(".letterInput");
        var word = $.makeArray(inputFields.map(function (index, field) {
            return field.value;
        })).join('');
        var validation = validateGuess(word);
        if (validation === true) {
        } else {
            $(this).siblings(".letterInput").first().focus();
            toastr.error(validation.message, validation.title);
            return;
        }
        // If you reached here, there were no errors
        var result = evaluateGuess(word);
        guessedWords.push(word);

        if (result.bulls < 4) {
            getNewWordField(true);
            $(this).siblings(".letterInput").each(function () {
                $(this).prop("disabled", "disabled");
            });
            $(this).prop("disabled", "disabled").toggle("visibility");
            $(this).siblings(".bulls").toggle(true).html(result.bulls.toString() + (result.bulls === 1 ? " bull" : " bulls"));
            $(this).siblings(".cows").toggle(true).html(result.cows.toString() + (result.cows === 1 ? " cow" : " cows"));
            if (global.settings.autoScratch === true) {
                if (result.cows === 0 && result.bulls === 0) {
                    $(word.split("")).each(function () {
                        $(".scratchArea [data-token=" + this + "]").addClass("scratched");
                    });
                }
            }
        } else {
            toastr.success("You got it!", "Aha!");
            $(this).toggle("visibility");
            $(this).siblings(".victoryMessage").toggle(true);
        }
    });

    $(".gameArea").on("click", function (e) {
        $(this).find("input:not([disabled]):first").focus();
    })

    $(".scratchArea").on("click", ".scratchItem", function () {
        $(this).toggleClass("scratched");
    });
});