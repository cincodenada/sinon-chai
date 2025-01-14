"use strict";
/* eslint-disable no-invalid-this */

(function (sinonChai) {
    // Module systems magic dance.

    /* istanbul ignore else */
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // NodeJS
        module.exports = sinonChai;
    } else if (typeof define === "function" && define.amd) {
        // AMD
        define(function () {
            return sinonChai;
        });
    } else {
        // Other environment (usually <script> tag): plug in to global chai instance directly.
        /* global chai: false */
        chai.use(sinonChai);
    }
}(function (chai, utils) {
    var slice = Array.prototype.slice;

    function isSpy(putativeSpy) {
        return typeof putativeSpy === "function" &&
               typeof putativeSpy.getCall === "function" &&
               typeof putativeSpy.calledWithExactly === "function";
    }

    function timesInWords(count) {
        switch (count) {
            case 1: {
                return "once";
            }
            case 2: {
                return "twice";
            }
            case 3: {
                return "thrice";
            }
            default: {
                return (count || 0) + " times";
            }
        }
    }

    function isCall(putativeCall) {
        return putativeCall && isSpy(putativeCall.proxy);
    }

    function assertCanWorkWith(assertion) {
        if (!isSpy(assertion._obj) && !isCall(assertion._obj)) {
            throw new TypeError(utils.inspect(assertion._obj) + " is not a spy or a call to a spy!");
        }
    }

    function getMessages(spy, action, suffixes, always, args) {
        var verbPhrase = always ? "always have " : "have ";

        // Suffixes is [nonNegatedSuffix, negatedSuffix], or just
        // nonNegatedSuffix if there is no negatedSuffix
        var negatedSuffix;
        var nonNegatedSuffix;
        if (Array.isArray(suffixes)) {
            nonNegatedSuffix = suffixes[0] || "";
            negatedSuffix = suffixes[1] || "";
        } else {
            nonNegatedSuffix = suffixes || "";
            negatedSuffix = "";
        }

        if (isSpy(spy.proxy)) {
            spy = spy.proxy;
        }

        function printfArray(array) {
            return spy.printf.apply(spy, array);
        }

        return {
            affirmative: function () {
                return printfArray(["expected %n to " + verbPhrase + action + nonNegatedSuffix].concat(args));
            },
            negative: function () {
                return printfArray(["expected %n to not " + verbPhrase + action + negatedSuffix].concat(args));
            }
        };
    }

    function sinonProperty(name, action, suffixes) {
        utils.addProperty(chai.Assertion.prototype, name, function () {
            assertCanWorkWith(this);

            var messages = getMessages(this._obj, action, suffixes, false);
            this.assert(this._obj[name], messages.affirmative, messages.negative);
        });
    }

    function sinonPropertyAsBooleanMethod(name, action, suffixes) {
        utils.addMethod(chai.Assertion.prototype, name, function (arg) {
            assertCanWorkWith(this);

            var messages = getMessages(this._obj, action, suffixes, false, [timesInWords(arg)]);
            this.assert(this._obj[name] === arg, messages.affirmative, messages.negative);
        });
    }

    function createSinonMethodHandler(sinonName, action, suffixes) {
        return function () {
            assertCanWorkWith(this);

            var alwaysSinonMethod = "always" + sinonName[0].toUpperCase() + sinonName.substring(1);
            var shouldBeAlways = utils.flag(this, "always") && typeof this._obj[alwaysSinonMethod] === "function";
            var sinonMethodName = shouldBeAlways ? alwaysSinonMethod : sinonName;

            var messages = getMessages(this._obj, action, suffixes, shouldBeAlways, slice.call(arguments));
            this.assert(
                this._obj[sinonMethodName].apply(this._obj, arguments),
                messages.affirmative,
                messages.negative
            );
        };
    }

    function sinonMethodAsProperty(name, action, suffixes) {
        var handler = createSinonMethodHandler(name, action, suffixes);
        utils.addProperty(chai.Assertion.prototype, name, handler);
    }

    function exceptionalSinonMethod(chaiName, sinonName, action, suffixes) {
        var handler = createSinonMethodHandler(sinonName, action, suffixes);
        utils.addMethod(chai.Assertion.prototype, chaiName, handler);
    }

    function sinonMethod(name, action, suffixes) {
        exceptionalSinonMethod(name, name, action, suffixes);
    }

    utils.addProperty(chai.Assertion.prototype, "always", function () {
        utils.flag(this, "always", true);
    });

    sinonProperty("called", "been called", " at least once, but it was never called");
    sinonPropertyAsBooleanMethod("callCount", "been called exactly %1", ", but it was called %c%C");
    sinonProperty("calledOnce", "been called exactly once", ", but it was called %c%C");
    sinonProperty("calledTwice", "been called exactly twice", ", but it was called %c%C");
    sinonProperty("calledThrice", "been called exactly thrice", ", but it was called %c%C");
    sinonMethodAsProperty("calledWithNew", "been called with new");
    sinonMethod("calledBefore", "been called before %1");
    sinonMethod("calledAfter", "been called after %1");
    sinonMethod("calledImmediatelyBefore", "been called immediately before %1");
    sinonMethod("calledImmediatelyAfter", "been called immediately after %1");
    sinonMethod("calledOn", "been called with %1 as this", ", but it was called with %t instead");
    sinonMethod("calledWith", "been called with arguments ", ["%D", "%*%C"]);
    sinonMethod("calledOnceWith", "been called exactly once with arguments ", ["%D", "%*%C"]);
    sinonMethod("calledWithExactly", "been called with exact arguments ", ["%D", "%*%C"]);
    sinonMethod("calledOnceWithExactly", "been called exactly once with exact arguments ", ["%D", "%*%C"]);
    sinonMethod("calledWithMatch", "been called with arguments matching ", ["%D", "%*%C"]);
    sinonMethod("returned", "returned %1");
    exceptionalSinonMethod("thrown", "threw", "thrown %1");
}));
