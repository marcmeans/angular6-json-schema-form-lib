import * as tslib_1 from "tslib";
import _ from 'lodash';
import { _executeAsyncValidators, _executeValidators, _mergeErrors, _mergeObjects, getType, hasValue, isArray, isBoolean, isDefined, isEmpty, isNumber, isString, isType, toJavaScriptType, toObservable, xor } from './validator.functions';
import { forEachCopy } from './utility.functions';
import { forkJoin } from 'rxjs';
import { jsonSchemaFormatTests } from './format-regex.constants';
import { map } from 'rxjs/operators';
/**
 * 'JsonValidators' class
 *
 * Provides an extended set of validators to be used by form controls,
 * compatible with standard JSON Schema validation options.
 * http://json-schema.org/latest/json-schema-validation.html
 *
 * Note: This library is designed as a drop-in replacement for the Angular
 * Validators library, and except for one small breaking change to the 'pattern'
 * validator (described below) it can even be imported as a substitute, like so:
 *
 *   import { JsonValidators as Validators } from 'json-validators';
 *
 * and it should work with existing code as a complete replacement.
 *
 * The one exception is the 'pattern' validator, which has been changed to
 * matche partial values by default (the standard 'pattern' validator wrapped
 * all patterns in '^' and '$', forcing them to always match an entire value).
 * However, the old behavior can be restored by simply adding '^' and '$'
 * around your patterns, or by passing an optional second parameter of TRUE.
 * This change is to make the 'pattern' validator match the behavior of a
 * JSON Schema pattern, which allows partial matches, rather than the behavior
 * of an HTML input control pattern, which does not.
 *
 * This library replaces Angular's validators and combination functions
 * with the following validators and transformation functions:
 *
 * Validators:
 *   For all formControls:     required (*), type, enum, const, customError
 *   For text formControls:    minLength (*), maxLength (*), pattern (*), format
 *   For numeric formControls: maximum, exclusiveMaximum,
 *                             minimum, exclusiveMinimum, multipleOf
 *   For formGroup objects:    minProperties, maxProperties, dependencies
 *   For formArray arrays:     minItems, maxItems, uniqueItems, contains
 *   Not used by JSON Schema:  min (*), max (*), requiredTrue (*), email (*)
 * (Validators originally included with Angular are maked with (*).)
 *
 * NOTE / TODO: The dependencies validator is not complete.
 * NOTE / TODO: The contains validator is not complete.
 *
 * Validators not used by JSON Schema (but included for compatibility)
 * and their JSON Schema equivalents:
 *
 *   Angular validator | JSON Schema equivalent
 *   ------------------|-----------------------
 *     min(number)     |   minimum(number)
 *     max(number)     |   maximum(number)
 *     requiredTrue()  |   const(true)
 *     email()         |   format('email')
 *
 * Validator transformation functions:
 *   composeAnyOf, composeOneOf, composeAllOf, composeNot
 * (Angular's original combination funciton, 'compose', is also included for
 * backward compatibility, though it is functionally equivalent to composeAllOf,
 * asside from its more generic error message.)
 *
 * All validators have also been extended to accept an optional second argument
 * which, if passed a TRUE value, causes the validator to perform the opposite
 * of its original finction. (This is used internally to enable 'not' and
 * 'composeOneOf' to function and return useful error messages.)
 *
 * The 'required' validator has also been overloaded so that if called with
 * a boolean parameter (or no parameters) it returns the original validator
 * function (rather than executing it). However, if it is called with an
 * AbstractControl parameter (as was previously required), it behaves
 * exactly as before.
 *
 * This enables all validators (including 'required') to be constructed in
 * exactly the same way, so they can be automatically applied using the
 * equivalent key names and values taken directly from a JSON Schema.
 *
 * This source code is partially derived from Angular,
 * which is Copyright (c) 2014-2017 Google, Inc.
 * Use of this source code is therefore governed by the same MIT-style license
 * that can be found in the LICENSE file at https://angular.io/license
 *
 * Original Angular Validators:
 * https://github.com/angular/angular/blob/master/packages/forms/src/validators.ts
 */
var JsonValidators = /** @class */ (function () {
    function JsonValidators() {
    }
    JsonValidators.required = function (input) {
        if (input === undefined) {
            input = true;
        }
        switch (input) {
            case true: // Return required function (do not execute it yet)
                return function (control, invert) {
                    if (invert === void 0) { invert = false; }
                    if (invert) {
                        return null;
                    } // if not required, always return valid
                    return hasValue(control.value) ? null : { 'required': true };
                };
            case false: // Do nothing (if field is not required, it is always valid)
                return JsonValidators.nullValidator;
            default: // Execute required function
                return hasValue(input.value) ? null : { 'required': true };
        }
    };
    /**
     * 'type' validator
     *
     * Requires a control to only accept values of a specified type,
     * or one of an array of types.
     *
     * Note: SchemaPrimitiveType = 'string'|'number'|'integer'|'boolean'|'null'
     *
     * // {SchemaPrimitiveType|SchemaPrimitiveType[]} type - type(s) to accept
     * // {IValidatorFn}
     */
    JsonValidators.type = function (requiredType) {
        if (!hasValue(requiredType)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isValid = isArray(requiredType) ?
                requiredType.some(function (type) { return isType(currentValue, type); }) :
                isType(currentValue, requiredType);
            return xor(isValid, invert) ?
                null : { 'type': { requiredType: requiredType, currentValue: currentValue } };
        };
    };
    /**
     * 'enum' validator
     *
     * Requires a control to have a value from an enumerated list of values.
     *
     * Converts types as needed to allow string inputs to still correctly
     * match number, boolean, and null enum values.
     *
     * // {any[]} allowedValues - array of acceptable values
     * // {IValidatorFn}
     */
    JsonValidators.enum = function (allowedValues) {
        if (!isArray(allowedValues)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isEqual = function (enumValue, inputValue) {
                return enumValue === inputValue ||
                    (isNumber(enumValue) && +inputValue === +enumValue) ||
                    (isBoolean(enumValue, 'strict') &&
                        toJavaScriptType(inputValue, 'boolean') === enumValue) ||
                    (enumValue === null && !hasValue(inputValue)) ||
                    _.isEqual(enumValue, inputValue);
            };
            var isValid = isArray(currentValue) ?
                currentValue.every(function (inputValue) { return allowedValues.some(function (enumValue) {
                    return isEqual(enumValue, inputValue);
                }); }) :
                allowedValues.some(function (enumValue) { return isEqual(enumValue, currentValue); });
            return xor(isValid, invert) ?
                null : { 'enum': { allowedValues: allowedValues, currentValue: currentValue } };
        };
    };
    /**
     * 'const' validator
     *
     * Requires a control to have a specific value.
     *
     * Converts types as needed to allow string inputs to still correctly
     * match number, boolean, and null values.
     *
     * TODO: modify to work with objects
     *
     * // {any[]} requiredValue - required value
     * // {IValidatorFn}
     */
    JsonValidators.const = function (requiredValue) {
        if (!hasValue(requiredValue)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isEqual = function (constValue, inputValue) {
                return constValue === inputValue ||
                    isNumber(constValue) && +inputValue === +constValue ||
                    isBoolean(constValue, 'strict') &&
                        toJavaScriptType(inputValue, 'boolean') === constValue ||
                    constValue === null && !hasValue(inputValue);
            };
            var isValid = isEqual(requiredValue, currentValue);
            return xor(isValid, invert) ?
                null : { 'const': { requiredValue: requiredValue, currentValue: currentValue } };
        };
    };
    /**
     * 'minLength' validator
     *
     * Requires a control's text value to be greater than a specified length.
     *
     * // {number} minimumLength - minimum allowed string length
     * // {boolean = false} invert - instead return error object only if valid
     * // {IValidatorFn}
     */
    JsonValidators.minLength = function (minimumLength) {
        if (!hasValue(minimumLength)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentLength = isString(control.value) ? control.value.length : 0;
            var isValid = currentLength >= minimumLength;
            return xor(isValid, invert) ?
                null : { 'minLength': { minimumLength: minimumLength, currentLength: currentLength } };
        };
    };
    /**
     * 'maxLength' validator
     *
     * Requires a control's text value to be less than a specified length.
     *
     * // {number} maximumLength - maximum allowed string length
     * // {boolean = false} invert - instead return error object only if valid
     * // {IValidatorFn}
     */
    JsonValidators.maxLength = function (maximumLength) {
        if (!hasValue(maximumLength)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            var currentLength = isString(control.value) ? control.value.length : 0;
            var isValid = currentLength <= maximumLength;
            return xor(isValid, invert) ?
                null : { 'maxLength': { maximumLength: maximumLength, currentLength: currentLength } };
        };
    };
    /**
     * 'pattern' validator
     *
     * Note: NOT the same as Angular's default pattern validator.
     *
     * Requires a control's value to match a specified regular expression pattern.
     *
     * This validator changes the behavior of default pattern validator
     * by replacing RegExp(`^${pattern}$`) with RegExp(`${pattern}`),
     * which allows for partial matches.
     *
     * To return to the default funcitonality, and match the entire string,
     * pass TRUE as the optional second parameter.
     *
     * // {string} pattern - regular expression pattern
     * // {boolean = false} wholeString - match whole value string?
     * // {IValidatorFn}
     */
    JsonValidators.pattern = function (pattern, wholeString) {
        if (wholeString === void 0) { wholeString = false; }
        if (!hasValue(pattern)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var regex;
            var requiredPattern;
            if (typeof pattern === 'string') {
                requiredPattern = (wholeString) ? "^" + pattern + "$" : pattern;
                regex = new RegExp(requiredPattern);
            }
            else {
                requiredPattern = pattern.toString();
                regex = pattern;
            }
            var currentValue = control.value;
            var isValid = isString(currentValue) ? regex.test(currentValue) : false;
            return xor(isValid, invert) ?
                null : { 'pattern': { requiredPattern: requiredPattern, currentValue: currentValue } };
        };
    };
    /**
     * 'format' validator
     *
     * Requires a control to have a value of a certain format.
     *
     * This validator currently checks the following formsts:
     *   date, time, date-time, email, hostname, ipv4, ipv6,
     *   uri, uri-reference, uri-template, url, uuid, color,
     *   json-pointer, relative-json-pointer, regex
     *
     * Fast format regular expressions copied from AJV:
     * https://github.com/epoberezkin/ajv/blob/master/lib/compile/formats.js
     *
     * // {JsonSchemaFormatNames} requiredFormat - format to check
     * // {IValidatorFn}
     */
    JsonValidators.format = function (requiredFormat) {
        if (!hasValue(requiredFormat)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var isValid;
            var currentValue = control.value;
            if (isString(currentValue)) {
                var formatTest = jsonSchemaFormatTests[requiredFormat];
                if (typeof formatTest === 'object') {
                    isValid = formatTest.test(currentValue);
                }
                else if (typeof formatTest === 'function') {
                    isValid = formatTest(currentValue);
                }
                else {
                    console.error("format validator error: \"" + requiredFormat + "\" is not a recognized format.");
                    isValid = true;
                }
            }
            else {
                // Allow JavaScript Date objects
                isValid = ['date', 'time', 'date-time'].includes(requiredFormat) &&
                    Object.prototype.toString.call(currentValue) === '[object Date]';
            }
            return xor(isValid, invert) ?
                null : { 'format': { requiredFormat: requiredFormat, currentValue: currentValue } };
        };
    };
    /**
     * 'minimum' validator
     *
     * Requires a control's numeric value to be greater than or equal to
     * a minimum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a minimum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} minimum - minimum allowed value
     * // {IValidatorFn}
     */
    JsonValidators.minimum = function (minimumValue) {
        if (!hasValue(minimumValue)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isValid = !isNumber(currentValue) || currentValue >= minimumValue;
            return xor(isValid, invert) ?
                null : { 'minimum': { minimumValue: minimumValue, currentValue: currentValue } };
        };
    };
    /**
     * 'exclusiveMinimum' validator
     *
     * Requires a control's numeric value to be less than a maximum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a maximum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} exclusiveMinimumValue - maximum allowed value
     * // {IValidatorFn}
     */
    JsonValidators.exclusiveMinimum = function (exclusiveMinimumValue) {
        if (!hasValue(exclusiveMinimumValue)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isValid = !isNumber(currentValue) || +currentValue < exclusiveMinimumValue;
            return xor(isValid, invert) ?
                null : { 'exclusiveMinimum': { exclusiveMinimumValue: exclusiveMinimumValue, currentValue: currentValue } };
        };
    };
    /**
     * 'maximum' validator
     *
     * Requires a control's numeric value to be less than or equal to
     * a maximum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a maximum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} maximumValue - maximum allowed value
     * // {IValidatorFn}
     */
    JsonValidators.maximum = function (maximumValue) {
        if (!hasValue(maximumValue)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isValid = !isNumber(currentValue) || +currentValue <= maximumValue;
            return xor(isValid, invert) ?
                null : { 'maximum': { maximumValue: maximumValue, currentValue: currentValue } };
        };
    };
    /**
     * 'exclusiveMaximum' validator
     *
     * Requires a control's numeric value to be less than a maximum amount.
     *
     * Any non-numeric value is also valid (according to the HTML forms spec,
     * a non-numeric value doesn't have a maximum).
     * https://www.w3.org/TR/html5/forms.html#attr-input-max
     *
     * // {number} exclusiveMaximumValue - maximum allowed value
     * // {IValidatorFn}
     */
    JsonValidators.exclusiveMaximum = function (exclusiveMaximumValue) {
        if (!hasValue(exclusiveMaximumValue)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isValid = !isNumber(currentValue) || +currentValue < exclusiveMaximumValue;
            return xor(isValid, invert) ?
                null : { 'exclusiveMaximum': { exclusiveMaximumValue: exclusiveMaximumValue, currentValue: currentValue } };
        };
    };
    /**
     * 'multipleOf' validator
     *
     * Requires a control to have a numeric value that is a multiple
     * of a specified number.
     *
     * // {number} multipleOfValue - number value must be a multiple of
     * // {IValidatorFn}
     */
    JsonValidators.multipleOf = function (multipleOfValue) {
        if (!hasValue(multipleOfValue)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentValue = control.value;
            var isValid = isNumber(currentValue) &&
                currentValue % multipleOfValue === 0;
            return xor(isValid, invert) ?
                null : { 'multipleOf': { multipleOfValue: multipleOfValue, currentValue: currentValue } };
        };
    };
    /**
     * 'minProperties' validator
     *
     * Requires a form group to have a minimum number of properties (i.e. have
     * values entered in a minimum number of controls within the group).
     *
     * // {number} minimumProperties - minimum number of properties allowed
     * // {IValidatorFn}
     */
    JsonValidators.minProperties = function (minimumProperties) {
        if (!hasValue(minimumProperties)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentProperties = Object.keys(control.value).length || 0;
            var isValid = currentProperties >= minimumProperties;
            return xor(isValid, invert) ?
                null : { 'minProperties': { minimumProperties: minimumProperties, currentProperties: currentProperties } };
        };
    };
    /**
     * 'maxProperties' validator
     *
     * Requires a form group to have a maximum number of properties (i.e. have
     * values entered in a maximum number of controls within the group).
     *
     * Note: Has no effect if the form group does not contain more than the
     * maximum number of controls.
     *
     * // {number} maximumProperties - maximum number of properties allowed
     * // {IValidatorFn}
     */
    JsonValidators.maxProperties = function (maximumProperties) {
        if (!hasValue(maximumProperties)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            var currentProperties = Object.keys(control.value).length || 0;
            var isValid = currentProperties <= maximumProperties;
            return xor(isValid, invert) ?
                null : { 'maxProperties': { maximumProperties: maximumProperties, currentProperties: currentProperties } };
        };
    };
    /**
     * 'dependencies' validator
     *
     * Requires the controls in a form group to meet additional validation
     * criteria, depending on the values of other controls in the group.
     *
     * Examples:
     * https://spacetelescope.github.io/understanding-json-schema/reference/object.html#dependencies
     *
     * // {any} dependencies - required dependencies
     * // {IValidatorFn}
     */
    JsonValidators.dependencies = function (dependencies) {
        if (getType(dependencies) !== 'object' || isEmpty(dependencies)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var allErrors = _mergeObjects(forEachCopy(dependencies, function (value, requiringField) {
                var e_1, _a, _b;
                if (!hasValue(control.value[requiringField])) {
                    return null;
                }
                var requiringFieldErrors = {};
                var requiredFields;
                var properties = {};
                if (getType(dependencies[requiringField]) === 'array') {
                    requiredFields = dependencies[requiringField];
                }
                else if (getType(dependencies[requiringField]) === 'object') {
                    requiredFields = dependencies[requiringField]['required'] || [];
                    properties = dependencies[requiringField]['properties'] || {};
                }
                try {
                    // Validate property dependencies
                    for (var requiredFields_1 = tslib_1.__values(requiredFields), requiredFields_1_1 = requiredFields_1.next(); !requiredFields_1_1.done; requiredFields_1_1 = requiredFields_1.next()) {
                        var requiredField = requiredFields_1_1.value;
                        if (xor(!hasValue(control.value[requiredField]), invert)) {
                            requiringFieldErrors[requiredField] = { 'required': true };
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (requiredFields_1_1 && !requiredFields_1_1.done && (_a = requiredFields_1.return)) _a.call(requiredFields_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                // Validate schema dependencies
                requiringFieldErrors = _mergeObjects(requiringFieldErrors, forEachCopy(properties, function (requirements, requiredField) {
                    var _a;
                    var requiredFieldErrors = _mergeObjects(forEachCopy(requirements, function (requirement, parameter) {
                        var validator = null;
                        if (requirement === 'maximum' || requirement === 'minimum') {
                            var exclusive = !!requirements['exclusiveM' + requirement.slice(1)];
                            validator = JsonValidators[requirement](parameter, exclusive);
                        }
                        else if (typeof JsonValidators[requirement] === 'function') {
                            validator = JsonValidators[requirement](parameter);
                        }
                        return !isDefined(validator) ?
                            null : validator(control.value[requiredField]);
                    }));
                    return isEmpty(requiredFieldErrors) ?
                        null : (_a = {}, _a[requiredField] = requiredFieldErrors, _a);
                }));
                return isEmpty(requiringFieldErrors) ?
                    null : (_b = {}, _b[requiringField] = requiringFieldErrors, _b);
            }));
            return isEmpty(allErrors) ? null : allErrors;
        };
    };
    /**
     * 'minItems' validator
     *
     * Requires a form array to have a minimum number of values.
     *
     * // {number} minimumItems - minimum number of items allowed
     * // {IValidatorFn}
     */
    JsonValidators.minItems = function (minimumItems) {
        if (!hasValue(minimumItems)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var currentItems = isArray(control.value) ? control.value.length : 0;
            var isValid = currentItems >= minimumItems;
            return xor(isValid, invert) ?
                null : { 'minItems': { minimumItems: minimumItems, currentItems: currentItems } };
        };
    };
    /**
     * 'maxItems' validator
     *
     * Requires a form array to have a maximum number of values.
     *
     * // {number} maximumItems - maximum number of items allowed
     * // {IValidatorFn}
     */
    JsonValidators.maxItems = function (maximumItems) {
        if (!hasValue(maximumItems)) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            var currentItems = isArray(control.value) ? control.value.length : 0;
            var isValid = currentItems <= maximumItems;
            return xor(isValid, invert) ?
                null : { 'maxItems': { maximumItems: maximumItems, currentItems: currentItems } };
        };
    };
    /**
     * 'uniqueItems' validator
     *
     * Requires values in a form array to be unique.
     *
     * // {boolean = true} unique? - true to validate, false to disable
     * // {IValidatorFn}
     */
    JsonValidators.uniqueItems = function (unique) {
        if (unique === void 0) { unique = true; }
        if (!unique) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var sorted = control.value.slice().sort();
            var duplicateItems = [];
            for (var i = 1; i < sorted.length; i++) {
                if (sorted[i - 1] === sorted[i] && duplicateItems.includes(sorted[i])) {
                    duplicateItems.push(sorted[i]);
                }
            }
            var isValid = !duplicateItems.length;
            return xor(isValid, invert) ?
                null : { 'uniqueItems': { duplicateItems: duplicateItems } };
        };
    };
    /**
     * 'customError' validator
     *
     * Shows a custom message if a message passed in.
     *
     * // {string} errorMessage - custom error message
     * // {boolean = false} invert - instead return error object only if valid
     * // {IValidatorFn}
     */
    JsonValidators.customError = function (errorMessage) {
        var message = typeof errorMessage != 'undefined' && errorMessage ? errorMessage : null;
        if (message === null) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            var isValid = false;
            return xor(isValid, invert) ?
                null : { 'customError': { errorMessage: message } };
        };
    };
    /**
     * 'contains' validator
     *
     * TODO: Complete this validator
     *
     * Requires values in a form array to be unique.
     *
     * // {boolean = true} unique? - true to validate, false to disable
     * // {IValidatorFn}
     */
    JsonValidators.contains = function (requiredItem) {
        if (requiredItem === void 0) { requiredItem = true; }
        if (!requiredItem) {
            return JsonValidators.nullValidator;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value) || !isArray(control.value)) {
                return null;
            }
            var currentItems = control.value;
            // const isValid = currentItems.some(item =>
            //
            // );
            var isValid = true;
            return xor(isValid, invert) ?
                null : { 'contains': { requiredItem: requiredItem, currentItems: currentItems } };
        };
    };
    /**
     * No-op validator. Included for backward compatibility.
     */
    JsonValidators.nullValidator = function (control) {
        return null;
    };
    /**
     * Validator transformation functions:
     * composeAnyOf, composeOneOf, composeAllOf, composeNot,
     * compose, composeAsync
     *
     * TODO: Add composeAnyOfAsync, composeOneOfAsync,
     *           composeAllOfAsync, composeNotAsync
     */
    /**
     * 'composeAnyOf' validator combination function
     *
     * Accepts an array of validators and returns a single validator that
     * evaluates to valid if any one or more of the submitted validators are
     * valid. If every validator is invalid, it returns combined errors from
     * all validators.
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    JsonValidators.composeAnyOf = function (validators) {
        if (!validators) {
            return null;
        }
        var presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            var arrayOfErrors = _executeValidators(control, presentValidators, invert).filter(isDefined);
            var isValid = validators.length > arrayOfErrors.length;
            return xor(isValid, invert) ?
                null : _mergeObjects.apply(void 0, tslib_1.__spread(arrayOfErrors, [{ 'anyOf': !invert }]));
        };
    };
    /**
     * 'composeOneOf' validator combination function
     *
     * Accepts an array of validators and returns a single validator that
     * evaluates to valid only if exactly one of the submitted validators
     * is valid. Otherwise returns combined information from all validators,
     * both valid and invalid.
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    JsonValidators.composeOneOf = function (validators) {
        if (!validators) {
            return null;
        }
        var presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            var arrayOfErrors = _executeValidators(control, presentValidators);
            var validControls = validators.length - arrayOfErrors.filter(isDefined).length;
            var isValid = validControls === 1;
            if (xor(isValid, invert)) {
                return null;
            }
            var arrayOfValids = _executeValidators(control, presentValidators, invert);
            return _mergeObjects.apply(void 0, tslib_1.__spread(arrayOfErrors, arrayOfValids, [{ 'oneOf': !invert }]));
        };
    };
    /**
     * 'composeAllOf' validator combination function
     *
     * Accepts an array of validators and returns a single validator that
     * evaluates to valid only if all the submitted validators are individually
     * valid. Otherwise it returns combined errors from all invalid validators.
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    JsonValidators.composeAllOf = function (validators) {
        if (!validators) {
            return null;
        }
        var presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            var combinedErrors = _mergeErrors(_executeValidators(control, presentValidators, invert));
            var isValid = combinedErrors === null;
            return (xor(isValid, invert)) ?
                null : _mergeObjects(combinedErrors, { 'allOf': !invert });
        };
    };
    /**
     * 'composeNot' validator inversion function
     *
     * Accepts a single validator function and inverts its result.
     * Returns valid if the submitted validator is invalid, and
     * returns invalid if the submitted validator is valid.
     * (Note: this function can itself be inverted
     *   - e.g. composeNot(composeNot(validator)) -
     *   but this can be confusing and is therefore not recommended.)
     *
     * // {IValidatorFn[]} validators - validator(s) to invert
     * // {IValidatorFn} - new validator function that returns opposite result
     */
    JsonValidators.composeNot = function (validator) {
        if (!validator) {
            return null;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            if (isEmpty(control.value)) {
                return null;
            }
            var error = validator(control, !invert);
            var isValid = error === null;
            return (xor(isValid, invert)) ?
                null : _mergeObjects(error, { 'not': !invert });
        };
    };
    /**
     * 'compose' validator combination function
     *
     * // {IValidatorFn[]} validators - array of validators to combine
     * // {IValidatorFn} - single combined validator function
     */
    JsonValidators.compose = function (validators) {
        if (!validators) {
            return null;
        }
        var presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return function (control, invert) {
            if (invert === void 0) { invert = false; }
            return _mergeErrors(_executeValidators(control, presentValidators, invert));
        };
    };
    /**
     * 'composeAsync' async validator combination function
     *
     * // {AsyncIValidatorFn[]} async validators - array of async validators
     * // {AsyncIValidatorFn} - single combined async validator function
     */
    JsonValidators.composeAsync = function (validators) {
        if (!validators) {
            return null;
        }
        var presentValidators = validators.filter(isDefined);
        if (presentValidators.length === 0) {
            return null;
        }
        return function (control) {
            var observables = _executeAsyncValidators(control, presentValidators).map(toObservable);
            return map.call(forkJoin(observables), _mergeErrors);
        };
    };
    // Additional angular validators (not used by Angualr JSON Schema Form)
    // From https://github.com/angular/angular/blob/master/packages/forms/src/validators.ts
    /**
     * Validator that requires controls to have a value greater than a number.
     */
    JsonValidators.min = function (min) {
        if (!hasValue(min)) {
            return JsonValidators.nullValidator;
        }
        return function (control) {
            // don't validate empty values to allow optional controls
            if (isEmpty(control.value) || isEmpty(min)) {
                return null;
            }
            var value = parseFloat(control.value);
            var actual = control.value;
            // Controls with NaN values after parsing should be treated as not having a
            // minimum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-min
            return isNaN(value) || value >= min ? null : { 'min': { min: min, actual: actual } };
        };
    };
    /**
     * Validator that requires controls to have a value less than a number.
     */
    JsonValidators.max = function (max) {
        if (!hasValue(max)) {
            return JsonValidators.nullValidator;
        }
        return function (control) {
            // don't validate empty values to allow optional controls
            if (isEmpty(control.value) || isEmpty(max)) {
                return null;
            }
            var value = parseFloat(control.value);
            var actual = control.value;
            // Controls with NaN values after parsing should be treated as not having a
            // maximum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-max
            return isNaN(value) || value <= max ? null : { 'max': { max: max, actual: actual } };
        };
    };
    /**
     * Validator that requires control value to be true.
     */
    JsonValidators.requiredTrue = function (control) {
        if (!control) {
            return JsonValidators.nullValidator;
        }
        return control.value === true ? null : { 'required': true };
    };
    /**
     * Validator that performs email validation.
     */
    JsonValidators.email = function (control) {
        if (!control) {
            return JsonValidators.nullValidator;
        }
        var EMAIL_REGEXP = 
        // tslint:disable-next-line:max-line-length
        /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;
        return EMAIL_REGEXP.test(control.value) ? null : { 'email': true };
    };
    return JsonValidators;
}());
export { JsonValidators };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi52YWxpZGF0b3JzLmpzIiwic291cmNlUm9vdCI6Im5nOi8vYW5ndWxhcjYtanNvbi1zY2hlbWEtZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9zaGFyZWQvanNvbi52YWxpZGF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLENBQUMsTUFBTSxRQUFRLENBQUM7QUFDdkIsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixrQkFBa0IsRUFDbEIsWUFBWSxFQUNaLGFBQWEsRUFFYixPQUFPLEVBQ1AsUUFBUSxFQUNSLE9BQU8sRUFDUCxTQUFTLEVBQ1QsU0FBUyxFQUNULE9BQU8sRUFDUCxRQUFRLEVBQ1IsUUFBUSxFQUNSLE1BQU0sRUFHTixnQkFBZ0IsRUFDaEIsWUFBWSxFQUNaLEdBQUcsRUFDRixNQUFNLHVCQUF1QixDQUFDO0FBRWpDLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNsRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQ2hDLE9BQU8sRUFBeUIscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUN4RixPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFJckM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQThFRztBQUNIO0lBQUE7SUFnd0JBLENBQUM7SUExdEJRLHVCQUFRLEdBQWYsVUFBZ0IsS0FBK0I7UUFDN0MsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1lBQUUsS0FBSyxHQUFHLElBQUksQ0FBQztTQUFFO1FBQzFDLFFBQVEsS0FBSyxFQUFFO1lBQ2IsS0FBSyxJQUFJLEVBQUUsbURBQW1EO2dCQUM1RCxPQUFPLFVBQUMsT0FBd0IsRUFBRSxNQUFjO29CQUFkLHVCQUFBLEVBQUEsY0FBYztvQkFDOUMsSUFBSSxNQUFNLEVBQUU7d0JBQUUsT0FBTyxJ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Q0FBQztTQUFFO1FBQ3RELElBQU0sWUFBWTtRQUNoQiwyQ0FBMkM7UUFDM0MsNExBQTRMLENBQUM7UUFDL0wsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUNyRSxDQUFDO0lBQ0gscUJBQUM7QUFBRCxDQUFDLEFBaHdCRCxJQWd3QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IHtcbiAgX2V4ZWN1dGVBc3luY1ZhbGlkYXRvcnMsXG4gIF9leGVjdXRlVmFsaWRhdG9ycyxcbiAgX21lcmdlRXJyb3JzLFxuICBfbWVyZ2VPYmplY3RzLFxuICBBc3luY0lWYWxpZGF0b3JGbixcbiAgZ2V0VHlwZSxcbiAgaGFzVmFsdWUsXG4gIGlzQXJyYXksXG4gIGlzQm9vbGVhbixcbiAgaXNEZWZpbmVkLFxuICBpc0VtcHR5LFxuICBpc051bWJlcixcbiAgaXNTdHJpbmcsXG4gIGlzVHlwZSxcbiAgSVZhbGlkYXRvckZuLFxuICBTY2hlbWFQcmltaXRpdmVUeXBlLFxuICB0b0phdmFTY3JpcHRUeXBlLFxuICB0b09ic2VydmFibGUsXG4gIHhvclxuICB9IGZyb20gJy4vdmFsaWRhdG9yLmZ1bmN0aW9ucyc7XG5pbXBvcnQgeyBBYnN0cmFjdENvbnRyb2wsIFZhbGlkYXRpb25FcnJvcnMsIFZhbGlkYXRvckZuIH0gZnJvbSAnQGFuZ3VsYXIvZm9ybXMnO1xuaW1wb3J0IHsgZm9yRWFjaENvcHkgfSBmcm9tICcuL3V0aWxpdHkuZnVuY3Rpb25zJztcbmltcG9ydCB7IGZvcmtKb2luIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQgeyBKc29uU2NoZW1hRm9ybWF0TmFtZXMsIGpzb25TY2hlbWFGb3JtYXRUZXN0cyB9IGZyb20gJy4vZm9ybWF0LXJlZ2V4LmNvbnN0YW50cyc7XG5pbXBvcnQgeyBtYXAgfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5cblxuXG4vKipcbiAqICdKc29uVmFsaWRhdG9ycycgY2xhc3NcbiAqXG4gKiBQcm92aWRlcyBhbiBleHRlbmRlZCBzZXQgb2YgdmFsaWRhdG9ycyB0byBiZSB1c2VkIGJ5IGZvcm0gY29udHJvbHMsXG4gKiBjb21wYXRpYmxlIHdpdGggc3RhbmRhcmQgSlNPTiBTY2hlbWEgdmFsaWRhdGlvbiBvcHRpb25zLlxuICogaHR0cDovL2pzb24tc2NoZW1hLm9yZy9sYXRlc3QvanNvbi1zY2hlbWEtdmFsaWRhdGlvbi5odG1sXG4gKlxuICogTm90ZTogVGhpcyBsaWJyYXJ5IGlzIGRlc2lnbmVkIGFzIGEgZHJvcC1pbiByZXBsYWNlbWVudCBmb3IgdGhlIEFuZ3VsYXJcbiAqIFZhbGlkYXRvcnMgbGlicmFyeSwgYW5kIGV4Y2VwdCBmb3Igb25lIHNtYWxsIGJyZWFraW5nIGNoYW5nZSB0byB0aGUgJ3BhdHRlcm4nXG4gKiB2YWxpZGF0b3IgKGRlc2NyaWJlZCBiZWxvdykgaXQgY2FuIGV2ZW4gYmUgaW1wb3J0ZWQgYXMgYSBzdWJzdGl0dXRlLCBsaWtlIHNvOlxuICpcbiAqICAgaW1wb3J0IHsgSnNvblZhbGlkYXRvcnMgYXMgVmFsaWRhdG9ycyB9IGZyb20gJ2pzb24tdmFsaWRhdG9ycyc7XG4gKlxuICogYW5kIGl0IHNob3VsZCB3b3JrIHdpdGggZXhpc3RpbmcgY29kZSBhcyBhIGNvbXBsZXRlIHJlcGxhY2VtZW50LlxuICpcbiAqIFRoZSBvbmUgZXhjZXB0aW9uIGlzIHRoZSAncGF0dGVybicgdmFsaWRhdG9yLCB3aGljaCBoYXMgYmVlbiBjaGFuZ2VkIHRvXG4gKiBtYXRjaGUgcGFydGlhbCB2YWx1ZXMgYnkgZGVmYXVsdCAodGhlIHN0YW5kYXJkICdwYXR0ZXJuJyB2YWxpZGF0b3Igd3JhcHBlZFxuICogYWxsIHBhdHRlcm5zIGluICdeJyBhbmQgJyQnLCBmb3JjaW5nIHRoZW0gdG8gYWx3YXlzIG1hdGNoIGFuIGVudGlyZSB2YWx1ZSkuXG4gKiBIb3dldmVyLCB0aGUgb2xkIGJlaGF2aW9yIGNhbiBiZSByZXN0b3JlZCBieSBzaW1wbHkgYWRkaW5nICdeJyBhbmQgJyQnXG4gKiBhcm91bmQgeW91ciBwYXR0ZXJucywgb3IgYnkgcGFzc2luZyBhbiBvcHRpb25hbCBzZWNvbmQgcGFyYW1ldGVyIG9mIFRSVUUuXG4gKiBUaGlzIGNoYW5nZSBpcyB0byBtYWtlIHRoZSAncGF0dGVybicgdmFsaWRhdG9yIG1hdGNoIHRoZSBiZWhhdmlvciBvZiBhXG4gKiBKU09OIFNjaGVtYSBwYXR0ZXJuLCB3aGljaCBhbGxvd3MgcGFydGlhbCBtYXRjaGVzLCByYXRoZXIgdGhhbiB0aGUgYmVoYXZpb3JcbiAqIG9mIGFuIEhUTUwgaW5wdXQgY29udHJvbCBwYXR0ZXJuLCB3aGljaCBkb2VzIG5vdC5cbiAqXG4gKiBUaGlzIGxpYnJhcnkgcmVwbGFjZXMgQW5ndWxhcidzIHZhbGlkYXRvcnMgYW5kIGNvbWJpbmF0aW9uIGZ1bmN0aW9uc1xuICogd2l0aCB0aGUgZm9sbG93aW5nIHZhbGlkYXRvcnMgYW5kIHRyYW5zZm9ybWF0aW9uIGZ1bmN0aW9uczpcbiAqXG4gKiBWYWxpZGF0b3JzOlxuICogICBGb3IgYWxsIGZvcm1Db250cm9sczogICAgIHJlcXVpcmVkICgqKSwgdHlwZSwgZW51bSwgY29uc3RcbiAqICAgRm9yIHRleHQgZm9ybUNvbnRyb2xzOiAgICBtaW5MZW5ndGggKCopLCBtYXhMZW5ndGggKCopLCBwYXR0ZXJuICgqKSwgZm9ybWF0XG4gKiAgIEZvciBudW1lcmljIGZvcm1Db250cm9sczogbWF4aW11bSwgZXhjbHVzaXZlTWF4aW11bSxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaW5pbXVtLCBleGNsdXNpdmVNaW5pbXVtLCBtdWx0aXBsZU9mXG4gKiAgIEZvciBmb3JtR3JvdXAgb2JqZWN0czogICAgbWluUHJvcGVydGllcywgbWF4UHJvcGVydGllcywgZGVwZW5kZW5jaWVzXG4gKiAgIEZvciBmb3JtQXJyYXkgYXJyYXlzOiAgICAgbWluSXRlbXMsIG1heEl0ZW1zLCB1bmlxdWVJdGVtcywgY29udGFpbnNcbiAqICAgTm90IHVzZWQgYnkgSlNPTiBTY2hlbWE6ICBtaW4gKCopLCBtYXggKCopLCByZXF1aXJlZFRydWUgKCopLCBlbWFpbCAoKilcbiAqIChWYWxpZGF0b3JzIG9yaWdpbmFsbHkgaW5jbHVkZWQgd2l0aCBBbmd1bGFyIGFyZSBtYWtlZCB3aXRoICgqKS4pXG4gKlxuICogTk9URSAvIFRPRE86IFRoZSBkZXBlbmRlbmNpZXMgdmFsaWRhdG9yIGlzIG5vdCBjb21wbGV0ZS5cbiAqIE5PVEUgLyBUT0RPOiBUaGUgY29udGFpbnMgdmFsaWRhdG9yIGlzIG5vdCBjb21wbGV0ZS5cbiAqXG4gKiBWYWxpZGF0b3JzIG5vdCB1c2VkIGJ5IEpTT04gU2NoZW1hIChidXQgaW5jbHVkZWQgZm9yIGNvbXBhdGliaWxpdHkpXG4gKiBhbmQgdGhlaXIgSlNPTiBTY2hlbWEgZXF1aXZhbGVudHM6XG4gKlxuICogICBBbmd1bGFyIHZhbGlkYXRvciB8IEpTT04gU2NoZW1hIGVxdWl2YWxlbnRcbiAqICAgLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgICAgbWluKG51bWJlcikgICAgIHwgICBtaW5pbXVtKG51bWJlcilcbiAqICAgICBtYXgobnVtYmVyKSAgICAgfCAgIG1heGltdW0obnVtYmVyKVxuICogICAgIHJlcXVpcmVkVHJ1ZSgpICB8ICAgY29uc3QodHJ1ZSlcbiAqICAgICBlbWFpbCgpICAgICAgICAgfCAgIGZvcm1hdCgnZW1haWwnKVxuICpcbiAqIFZhbGlkYXRvciB0cmFuc2Zvcm1hdGlvbiBmdW5jdGlvbnM6XG4gKiAgIGNvbXBvc2VBbnlPZiwgY29tcG9zZU9uZU9mLCBjb21wb3NlQWxsT2YsIGNvbXBvc2VOb3RcbiAqIChBbmd1bGFyJ3Mgb3JpZ2luYWwgY29tYmluYXRpb24gZnVuY2l0b24sICdjb21wb3NlJywgaXMgYWxzbyBpbmNsdWRlZCBmb3JcbiAqIGJhY2t3YXJkIGNvbXBhdGliaWxpdHksIHRob3VnaCBpdCBpcyBmdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBjb21wb3NlQWxsT2YsXG4gKiBhc3NpZGUgZnJvbSBpdHMgbW9yZSBnZW5lcmljIGVycm9yIG1lc3NhZ2UuKVxuICpcbiAqIEFsbCB2YWxpZGF0b3JzIGhhdmUgYWxzbyBiZWVuIGV4dGVuZGVkIHRvIGFjY2VwdCBhbiBvcHRpb25hbCBzZWNvbmQgYXJndW1lbnRcbiAqIHdoaWNoLCBpZiBwYXNzZWQgYSBUUlVFIHZhbHVlLCBjYXVzZXMgdGhlIHZhbGlkYXRvciB0byBwZXJmb3JtIHRoZSBvcHBvc2l0ZVxuICogb2YgaXRzIG9yaWdpbmFsIGZpbmN0aW9uLiAoVGhpcyBpcyB1c2VkIGludGVybmFsbHkgdG8gZW5hYmxlICdub3QnIGFuZFxuICogJ2NvbXBvc2VPbmVPZicgdG8gZnVuY3Rpb24gYW5kIHJldHVybiB1c2VmdWwgZXJyb3IgbWVzc2FnZXMuKVxuICpcbiAqIFRoZSAncmVxdWlyZWQnIHZhbGlkYXRvciBoYXMgYWxzbyBiZWVuIG92ZXJsb2FkZWQgc28gdGhhdCBpZiBjYWxsZWQgd2l0aFxuICogYSBib29sZWFuIHBhcmFtZXRlciAob3Igbm8gcGFyYW1ldGVycykgaXQgcmV0dXJucyB0aGUgb3JpZ2luYWwgdmFsaWRhdG9yXG4gKiBmdW5jdGlvbiAocmF0aGVyIHRoYW4gZXhlY3V0aW5nIGl0KS4gSG93ZXZlciwgaWYgaXQgaXMgY2FsbGVkIHdpdGggYW5cbiAqIEFic3RyYWN0Q29udHJvbCBwYXJhbWV0ZXIgKGFzIHdhcyBwcmV2aW91c2x5IHJlcXVpcmVkKSwgaXQgYmVoYXZlc1xuICogZXhhY3RseSBhcyBiZWZvcmUuXG4gKlxuICogVGhpcyBlbmFibGVzIGFsbCB2YWxpZGF0b3JzIChpbmNsdWRpbmcgJ3JlcXVpcmVkJykgdG8gYmUgY29uc3RydWN0ZWQgaW5cbiAqIGV4YWN0bHkgdGhlIHNhbWUgd2F5LCBzbyB0aGV5IGNhbiBiZSBhdXRvbWF0aWNhbGx5IGFwcGxpZWQgdXNpbmcgdGhlXG4gKiBlcXVpdmFsZW50IGtleSBuYW1lcyBhbmQgdmFsdWVzIHRha2VuIGRpcmVjdGx5IGZyb20gYSBKU09OIFNjaGVtYS5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIHBhcnRpYWxseSBkZXJpdmVkIGZyb20gQW5ndWxhcixcbiAqIHdoaWNoIGlzIENvcHlyaWdodCAoYykgMjAxNC0yMDE3IEdvb2dsZSwgSW5jLlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgdGhlcmVmb3JlIGdvdmVybmVkIGJ5IHRoZSBzYW1lIE1JVC1zdHlsZSBsaWNlbnNlXG4gKiB0aGF0IGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKlxuICogT3JpZ2luYWwgQW5ndWxhciBWYWxpZGF0b3JzOlxuICogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iL21hc3Rlci9wYWNrYWdlcy9mb3Jtcy9zcmMvdmFsaWRhdG9ycy50c1xuICovXG5leHBvcnQgY2xhc3MgSnNvblZhbGlkYXRvcnMge1xuXG4gIC8qKlxuICAgKiBWYWxpZGF0b3IgZnVuY3Rpb25zOlxuICAgKlxuICAgKiBGb3IgYWxsIGZvcm1Db250cm9sczogICAgIHJlcXVpcmVkLCB0eXBlLCBlbnVtLCBjb25zdFxuICAgKiBGb3IgdGV4dCBmb3JtQ29udHJvbHM6ICAgIG1pbkxlbmd0aCwgbWF4TGVuZ3RoLCBwYXR0ZXJuLCBmb3JtYXRcbiAgICogRm9yIG51bWVyaWMgZm9ybUNvbnRyb2xzOiBtYXhpbXVtLCBleGNsdXNpdmVNYXhpbXVtLFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIG1pbmltdW0sIGV4Y2x1c2l2ZU1pbmltdW0sIG11bHRpcGxlT2ZcbiAgICogRm9yIGZvcm1Hcm91cCBvYmplY3RzOiAgICBtaW5Qcm9wZXJ0aWVzLCBtYXhQcm9wZXJ0aWVzLCBkZXBlbmRlbmNpZXNcbiAgICogRm9yIGZvcm1BcnJheSBhcnJheXM6ICAgICBtaW5JdGVtcywgbWF4SXRlbXMsIHVuaXF1ZUl0ZW1zLCBjb250YWluc1xuICAgKlxuICAgKiBUT0RPOiBmaW5pc2ggZGVwZW5kZW5jaWVzIHZhbGlkYXRvclxuICAgKi9cblxuICAvKipcbiAgICogJ3JlcXVpcmVkJyB2YWxpZGF0b3JcbiAgICpcbiAgICogVGhpcyB2YWxpZGF0b3IgaXMgb3ZlcmxvYWRlZCwgY29tcGFyZWQgdG8gdGhlIGRlZmF1bHQgcmVxdWlyZWQgdmFsaWRhdG9yLlxuICAgKiBJZiBjYWxsZWQgd2l0aCBubyBwYXJhbWV0ZXJzLCBvciBUUlVFLCB0aGlzIHZhbGlkYXRvciByZXR1cm5zIHRoZVxuICAgKiAncmVxdWlyZWQnIHZhbGlkYXRvciBmdW5jdGlvbiAocmF0aGVyIHRoYW4gZXhlY3V0aW5nIGl0KS4gVGhpcyBtYXRjaGVzXG4gICAqIHRoZSBiZWhhdmlvciBvZiBhbGwgb3RoZXIgdmFsaWRhdG9ycyBpbiB0aGlzIGxpYnJhcnkuXG4gICAqXG4gICAqIElmIHRoaXMgdmFsaWRhdG9yIGlzIGNhbGxlZCB3aXRoIGFuIEFic3RyYWN0Q29udHJvbCBwYXJhbWV0ZXJcbiAgICogKGFzIHdhcyBwcmV2aW91c2x5IHJlcXVpcmVkKSBpdCBiZWhhdmVzIHRoZSBzYW1lIGFzIEFuZ3VsYXIncyBkZWZhdWx0XG4gICAqIHJlcXVpcmVkIHZhbGlkYXRvciwgYW5kIHJldHVybnMgYW4gZXJyb3IgaWYgdGhlIGNvbnRyb2wgaXMgZW1wdHkuXG4gICAqXG4gICAqIE9sZCBiZWhhdmlvcjogKGlmIGlucHV0IHR5cGUgPSBBYnN0cmFjdENvbnRyb2wpXG4gICAqIC8vIHtBYnN0cmFjdENvbnRyb2x9IGNvbnRyb2wgLSByZXF1aXJlZCBjb250cm9sXG4gICAqIC8vIHt7W2tleTogc3RyaW5nXTogYm9vbGVhbn19IC0gcmV0dXJucyBlcnJvciBtZXNzYWdlIGlmIG5vIGlucHV0XG4gICAqXG4gICAqIE5ldyBiZWhhdmlvcjogKGlmIG5vIGlucHV0LCBvciBpbnB1dCB0eXBlID0gYm9vbGVhbilcbiAgICogLy8ge2Jvb2xlYW4gPSB0cnVlfSByZXF1aXJlZD8gLSB0cnVlIHRvIHZhbGlkYXRlLCBmYWxzZSB0byBkaXNhYmxlXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59IC0gcmV0dXJucyB0aGUgJ3JlcXVpcmVkJyB2YWxpZGF0b3IgZnVuY3Rpb24gaXRzZWxmXG4gICAqL1xuICBzdGF0aWMgcmVxdWlyZWQoaW5wdXQ6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbDtcbiAgc3RhdGljIHJlcXVpcmVkKGlucHV0PzogYm9vbGVhbik6IElWYWxpZGF0b3JGbjtcblxuICBzdGF0aWMgcmVxdWlyZWQoaW5wdXQ/OiBBYnN0cmFjdENvbnRyb2x8Ym9vbGVhbik6IFZhbGlkYXRpb25FcnJvcnN8bnVsbHxJVmFsaWRhdG9yRm4ge1xuICAgIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKSB7IGlucHV0ID0gdHJ1ZTsgfVxuICAgIHN3aXRjaCAoaW5wdXQpIHtcbiAgICAgIGNhc2UgdHJ1ZTogLy8gUmV0dXJuIHJlcXVpcmVkIGZ1bmN0aW9uIChkbyBub3QgZXhlY3V0ZSBpdCB5ZXQpXG4gICAgICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICAgICAgaWYgKGludmVydCkgeyByZXR1cm4gbnVsbDsgfSAvLyBpZiBub3QgcmVxdWlyZWQsIGFsd2F5cyByZXR1cm4gdmFsaWRcbiAgICAgICAgICByZXR1cm4gaGFzVmFsdWUoY29udHJvbC52YWx1ZSkgPyBudWxsIDogeyAncmVxdWlyZWQnOiB0cnVlIH07XG4gICAgICAgIH07XG4gICAgICBjYXNlIGZhbHNlOiAvLyBEbyBub3RoaW5nIChpZiBmaWVsZCBpcyBub3QgcmVxdWlyZWQsIGl0IGlzIGFsd2F5cyB2YWxpZClcbiAgICAgICAgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7XG4gICAgICBkZWZhdWx0OiAvLyBFeGVjdXRlIHJlcXVpcmVkIGZ1bmN0aW9uXG4gICAgICAgIHJldHVybiBoYXNWYWx1ZSgoPEFic3RyYWN0Q29udHJvbD5pbnB1dCkudmFsdWUpID8gbnVsbCA6IHsgJ3JlcXVpcmVkJzogdHJ1ZSB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiAndHlwZScgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCB0byBvbmx5IGFjY2VwdCB2YWx1ZXMgb2YgYSBzcGVjaWZpZWQgdHlwZSxcbiAgICogb3Igb25lIG9mIGFuIGFycmF5IG9mIHR5cGVzLlxuICAgKlxuICAgKiBOb3RlOiBTY2hlbWFQcmltaXRpdmVUeXBlID0gJ3N0cmluZyd8J251bWJlcid8J2ludGVnZXInfCdib29sZWFuJ3wnbnVsbCdcbiAgICpcbiAgICogLy8ge1NjaGVtYVByaW1pdGl2ZVR5cGV8U2NoZW1hUHJpbWl0aXZlVHlwZVtdfSB0eXBlIC0gdHlwZShzKSB0byBhY2NlcHRcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyB0eXBlKHJlcXVpcmVkVHlwZTogU2NoZW1hUHJpbWl0aXZlVHlwZXxTY2hlbWFQcmltaXRpdmVUeXBlW10pOiBJVmFsaWRhdG9yRm4ge1xuICAgIGlmICghaGFzVmFsdWUocmVxdWlyZWRUeXBlKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgY3VycmVudFZhbHVlOiBhbnkgPSBjb250cm9sLnZhbHVlO1xuICAgICAgY29uc3QgaXNWYWxpZCA9IGlzQXJyYXkocmVxdWlyZWRUeXBlKSA/XG4gICAgICAgICg8U2NoZW1hUHJpbWl0aXZlVHlwZVtdPnJlcXVpcmVkVHlwZSkuc29tZSh0eXBlID0+IGlzVHlwZShjdXJyZW50VmFsdWUsIHR5cGUpKSA6XG4gICAgICAgIGlzVHlwZShjdXJyZW50VmFsdWUsIDxTY2hlbWFQcmltaXRpdmVUeXBlPnJlcXVpcmVkVHlwZSk7XG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xuICAgICAgICBudWxsIDogeyAndHlwZSc6IHsgcmVxdWlyZWRUeXBlLCBjdXJyZW50VmFsdWUgfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ2VudW0nIHZhbGlkYXRvclxuICAgKlxuICAgKiBSZXF1aXJlcyBhIGNvbnRyb2wgdG8gaGF2ZSBhIHZhbHVlIGZyb20gYW4gZW51bWVyYXRlZCBsaXN0IG9mIHZhbHVlcy5cbiAgICpcbiAgICogQ29udmVydHMgdHlwZXMgYXMgbmVlZGVkIHRvIGFsbG93IHN0cmluZyBpbnB1dHMgdG8gc3RpbGwgY29ycmVjdGx5XG4gICAqIG1hdGNoIG51bWJlciwgYm9vbGVhbiwgYW5kIG51bGwgZW51bSB2YWx1ZXMuXG4gICAqXG4gICAqIC8vIHthbnlbXX0gYWxsb3dlZFZhbHVlcyAtIGFycmF5IG9mIGFjY2VwdGFibGUgdmFsdWVzXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XG4gICAqL1xuICBzdGF0aWMgZW51bShhbGxvd2VkVmFsdWVzOiBhbnlbXSk6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFpc0FycmF5KGFsbG93ZWRWYWx1ZXMpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWU6IGFueSA9IGNvbnRyb2wudmFsdWU7XG4gICAgICBjb25zdCBpc0VxdWFsID0gKGVudW1WYWx1ZSwgaW5wdXRWYWx1ZSkgPT5cbiAgICAgICAgZW51bVZhbHVlID09PSBpbnB1dFZhbHVlIHx8XG4gICAgICAgIChpc051bWJlcihlbnVtVmFsdWUpICYmICtpbnB1dFZhbHVlID09PSArZW51bVZhbHVlKSB8fFxuICAgICAgICAoaXNCb29sZWFuKGVudW1WYWx1ZSwgJ3N0cmljdCcpICYmXG4gICAgICAgICAgdG9KYXZhU2NyaXB0VHlwZShpbnB1dFZhbHVlLCAnYm9vbGVhbicpID09PSBlbnVtVmFsdWUpIHx8XG4gICAgICAgIChlbnVtVmFsdWUgPT09IG51bGwgJiYgIWhhc1ZhbHVlKGlucHV0VmFsdWUpKSB8fFxuICAgICAgICBfLmlzRXF1YWwoZW51bVZhbHVlLCBpbnB1dFZhbHVlKTtcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSBpc0FycmF5KGN1cnJlbnRWYWx1ZSkgP1xuICAgICAgICBjdXJyZW50VmFsdWUuZXZlcnkoaW5wdXRWYWx1ZSA9PiBhbGxvd2VkVmFsdWVzLnNvbWUoZW51bVZhbHVlID0+XG4gICAgICAgICAgaXNFcXVhbChlbnVtVmFsdWUsIGlucHV0VmFsdWUpXG4gICAgICAgICkpIDpcbiAgICAgICAgYWxsb3dlZFZhbHVlcy5zb21lKGVudW1WYWx1ZSA9PiBpc0VxdWFsKGVudW1WYWx1ZSwgY3VycmVudFZhbHVlKSk7XG4gICAgICByZXR1cm4geG9yKGlzVmFsaWQsIGludmVydCkgP1xuICAgICAgICBudWxsIDogeyAnZW51bSc6IHsgYWxsb3dlZFZhbHVlcywgY3VycmVudFZhbHVlIH0gfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqICdjb25zdCcgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCB0byBoYXZlIGEgc3BlY2lmaWMgdmFsdWUuXG4gICAqXG4gICAqIENvbnZlcnRzIHR5cGVzIGFzIG5lZWRlZCB0byBhbGxvdyBzdHJpbmcgaW5wdXRzIHRvIHN0aWxsIGNvcnJlY3RseVxuICAgKiBtYXRjaCBudW1iZXIsIGJvb2xlYW4sIGFuZCBudWxsIHZhbHVlcy5cbiAgICpcbiAgICogVE9ETzogbW9kaWZ5IHRvIHdvcmsgd2l0aCBvYmplY3RzXG4gICAqXG4gICAqIC8vIHthbnlbXX0gcmVxdWlyZWRWYWx1ZSAtIHJlcXVpcmVkIHZhbHVlXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XG4gICAqL1xuICBzdGF0aWMgY29uc3QocmVxdWlyZWRWYWx1ZTogYW55KTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIWhhc1ZhbHVlKHJlcXVpcmVkVmFsdWUpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWU6IGFueSA9IGNvbnRyb2wudmFsdWU7XG4gICAgICBjb25zdCBpc0VxdWFsID0gKGNvbnN0VmFsdWUsIGlucHV0VmFsdWUpID0+XG4gICAgICAgIGNvbnN0VmFsdWUgPT09IGlucHV0VmFsdWUgfHxcbiAgICAgICAgaXNOdW1iZXIoY29uc3RWYWx1ZSkgJiYgK2lucHV0VmFsdWUgPT09ICtjb25zdFZhbHVlIHx8XG4gICAgICAgIGlzQm9vbGVhbihjb25zdFZhbHVlLCAnc3RyaWN0JykgJiZcbiAgICAgICAgICB0b0phdmFTY3JpcHRUeXBlKGlucHV0VmFsdWUsICdib29sZWFuJykgPT09IGNvbnN0VmFsdWUgfHxcbiAgICAgICAgY29uc3RWYWx1ZSA9PT0gbnVsbCAmJiAhaGFzVmFsdWUoaW5wdXRWYWx1ZSk7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gaXNFcXVhbChyZXF1aXJlZFZhbHVlLCBjdXJyZW50VmFsdWUpO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ2NvbnN0JzogeyByZXF1aXJlZFZhbHVlLCBjdXJyZW50VmFsdWUgfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ21pbkxlbmd0aCcgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIHRleHQgdmFsdWUgdG8gYmUgZ3JlYXRlciB0aGFuIGEgc3BlY2lmaWVkIGxlbmd0aC5cbiAgICpcbiAgICogLy8ge251bWJlcn0gbWluaW11bUxlbmd0aCAtIG1pbmltdW0gYWxsb3dlZCBzdHJpbmcgbGVuZ3RoXG4gICAqIC8vIHtib29sZWFuID0gZmFsc2V9IGludmVydCAtIGluc3RlYWQgcmV0dXJuIGVycm9yIG9iamVjdCBvbmx5IGlmIHZhbGlkXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XG4gICAqL1xuICBzdGF0aWMgbWluTGVuZ3RoKG1pbmltdW1MZW5ndGg6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFoYXNWYWx1ZShtaW5pbXVtTGVuZ3RoKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgY3VycmVudExlbmd0aCA9IGlzU3RyaW5nKGNvbnRyb2wudmFsdWUpID8gY29udHJvbC52YWx1ZS5sZW5ndGggOiAwO1xuICAgICAgY29uc3QgaXNWYWxpZCA9IGN1cnJlbnRMZW5ndGggPj0gbWluaW11bUxlbmd0aDtcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XG4gICAgICAgIG51bGwgOiB7ICdtaW5MZW5ndGgnOiB7IG1pbmltdW1MZW5ndGgsIGN1cnJlbnRMZW5ndGggfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ21heExlbmd0aCcgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIHRleHQgdmFsdWUgdG8gYmUgbGVzcyB0aGFuIGEgc3BlY2lmaWVkIGxlbmd0aC5cbiAgICpcbiAgICogLy8ge251bWJlcn0gbWF4aW11bUxlbmd0aCAtIG1heGltdW0gYWxsb3dlZCBzdHJpbmcgbGVuZ3RoXG4gICAqIC8vIHtib29sZWFuID0gZmFsc2V9IGludmVydCAtIGluc3RlYWQgcmV0dXJuIGVycm9yIG9iamVjdCBvbmx5IGlmIHZhbGlkXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XG4gICAqL1xuICBzdGF0aWMgbWF4TGVuZ3RoKG1heGltdW1MZW5ndGg6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFoYXNWYWx1ZShtYXhpbXVtTGVuZ3RoKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50TGVuZ3RoID0gaXNTdHJpbmcoY29udHJvbC52YWx1ZSkgPyBjb250cm9sLnZhbHVlLmxlbmd0aCA6IDA7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gY3VycmVudExlbmd0aCA8PSBtYXhpbXVtTGVuZ3RoO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ21heExlbmd0aCc6IHsgbWF4aW11bUxlbmd0aCwgY3VycmVudExlbmd0aCB9IH07XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiAncGF0dGVybicgdmFsaWRhdG9yXG4gICAqXG4gICAqIE5vdGU6IE5PVCB0aGUgc2FtZSBhcyBBbmd1bGFyJ3MgZGVmYXVsdCBwYXR0ZXJuIHZhbGlkYXRvci5cbiAgICpcbiAgICogUmVxdWlyZXMgYSBjb250cm9sJ3MgdmFsdWUgdG8gbWF0Y2ggYSBzcGVjaWZpZWQgcmVndWxhciBleHByZXNzaW9uIHBhdHRlcm4uXG4gICAqXG4gICAqIFRoaXMgdmFsaWRhdG9yIGNoYW5nZXMgdGhlIGJlaGF2aW9yIG9mIGRlZmF1bHQgcGF0dGVybiB2YWxpZGF0b3JcbiAgICogYnkgcmVwbGFjaW5nIFJlZ0V4cChgXiR7cGF0dGVybn0kYCkgd2l0aCBSZWdFeHAoYCR7cGF0dGVybn1gKSxcbiAgICogd2hpY2ggYWxsb3dzIGZvciBwYXJ0aWFsIG1hdGNoZXMuXG4gICAqXG4gICAqIFRvIHJldHVybiB0byB0aGUgZGVmYXVsdCBmdW5jaXRvbmFsaXR5LCBhbmQgbWF0Y2ggdGhlIGVudGlyZSBzdHJpbmcsXG4gICAqIHBhc3MgVFJVRSBhcyB0aGUgb3B0aW9uYWwgc2Vjb25kIHBhcmFtZXRlci5cbiAgICpcbiAgICogLy8ge3N0cmluZ30gcGF0dGVybiAtIHJlZ3VsYXIgZXhwcmVzc2lvbiBwYXR0ZXJuXG4gICAqIC8vIHtib29sZWFuID0gZmFsc2V9IHdob2xlU3RyaW5nIC0gbWF0Y2ggd2hvbGUgdmFsdWUgc3RyaW5nP1xuICAgKiAvLyB7SVZhbGlkYXRvckZufVxuICAgKi9cbiAgc3RhdGljIHBhdHRlcm4ocGF0dGVybjogc3RyaW5nfFJlZ0V4cCwgd2hvbGVTdHJpbmcgPSBmYWxzZSk6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFoYXNWYWx1ZShwYXR0ZXJuKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgbGV0IHJlZ2V4OiBSZWdFeHA7XG4gICAgICBsZXQgcmVxdWlyZWRQYXR0ZXJuOiBzdHJpbmc7XG4gICAgICBpZiAodHlwZW9mIHBhdHRlcm4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHJlcXVpcmVkUGF0dGVybiA9ICh3aG9sZVN0cmluZykgPyBgXiR7cGF0dGVybn0kYCA6IHBhdHRlcm47XG4gICAgICAgIHJlZ2V4ID0gbmV3IFJlZ0V4cChyZXF1aXJlZFBhdHRlcm4pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWlyZWRQYXR0ZXJuID0gcGF0dGVybi50b1N0cmluZygpO1xuICAgICAgICByZWdleCA9IHBhdHRlcm47XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWU6IHN0cmluZyA9IGNvbnRyb2wudmFsdWU7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gaXNTdHJpbmcoY3VycmVudFZhbHVlKSA/IHJlZ2V4LnRlc3QoY3VycmVudFZhbHVlKSA6IGZhbHNlO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ3BhdHRlcm4nOiB7IHJlcXVpcmVkUGF0dGVybiwgY3VycmVudFZhbHVlIH0gfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqICdmb3JtYXQnIHZhbGlkYXRvclxuICAgKlxuICAgKiBSZXF1aXJlcyBhIGNvbnRyb2wgdG8gaGF2ZSBhIHZhbHVlIG9mIGEgY2VydGFpbiBmb3JtYXQuXG4gICAqXG4gICAqIFRoaXMgdmFsaWRhdG9yIGN1cnJlbnRseSBjaGVja3MgdGhlIGZvbGxvd2luZyBmb3Jtc3RzOlxuICAgKiAgIGRhdGUsIHRpbWUsIGRhdGUtdGltZSwgZW1haWwsIGhvc3RuYW1lLCBpcHY0LCBpcHY2LFxuICAgKiAgIHVyaSwgdXJpLXJlZmVyZW5jZSwgdXJpLXRlbXBsYXRlLCB1cmwsIHV1aWQsIGNvbG9yLFxuICAgKiAgIGpzb24tcG9pbnRlciwgcmVsYXRpdmUtanNvbi1wb2ludGVyLCByZWdleFxuICAgKlxuICAgKiBGYXN0IGZvcm1hdCByZWd1bGFyIGV4cHJlc3Npb25zIGNvcGllZCBmcm9tIEFKVjpcbiAgICogaHR0cHM6Ly9naXRodWIuY29tL2Vwb2JlcmV6a2luL2Fqdi9ibG9iL21hc3Rlci9saWIvY29tcGlsZS9mb3JtYXRzLmpzXG4gICAqXG4gICAqIC8vIHtKc29uU2NoZW1hRm9ybWF0TmFtZXN9IHJlcXVpcmVkRm9ybWF0IC0gZm9ybWF0IHRvIGNoZWNrXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XG4gICAqL1xuICBzdGF0aWMgZm9ybWF0KHJlcXVpcmVkRm9ybWF0OiBKc29uU2NoZW1hRm9ybWF0TmFtZXMpOiBJVmFsaWRhdG9yRm4ge1xuICAgIGlmICghaGFzVmFsdWUocmVxdWlyZWRGb3JtYXQpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICBsZXQgaXNWYWxpZDogYm9vbGVhbjtcbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZTogc3RyaW5nfERhdGUgPSBjb250cm9sLnZhbHVlO1xuICAgICAgaWYgKGlzU3RyaW5nKGN1cnJlbnRWYWx1ZSkpIHtcbiAgICAgICAgY29uc3QgZm9ybWF0VGVzdDogRnVuY3Rpb258UmVnRXhwID0ganNvblNjaGVtYUZvcm1hdFRlc3RzW3JlcXVpcmVkRm9ybWF0XTtcbiAgICAgICAgaWYgKHR5cGVvZiBmb3JtYXRUZXN0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgIGlzVmFsaWQgPSAoPFJlZ0V4cD5mb3JtYXRUZXN0KS50ZXN0KDxzdHJpbmc+Y3VycmVudFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZm9ybWF0VGVzdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGlzVmFsaWQgPSAoPEZ1bmN0aW9uPmZvcm1hdFRlc3QpKDxzdHJpbmc+Y3VycmVudFZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGBmb3JtYXQgdmFsaWRhdG9yIGVycm9yOiBcIiR7cmVxdWlyZWRGb3JtYXR9XCIgaXMgbm90IGEgcmVjb2duaXplZCBmb3JtYXQuYCk7XG4gICAgICAgICAgaXNWYWxpZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEFsbG93IEphdmFTY3JpcHQgRGF0ZSBvYmplY3RzXG4gICAgICAgIGlzVmFsaWQgPSBbJ2RhdGUnLCAndGltZScsICdkYXRlLXRpbWUnXS5pbmNsdWRlcyhyZXF1aXJlZEZvcm1hdCkgJiZcbiAgICAgICAgICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoY3VycmVudFZhbHVlKSA9PT0gJ1tvYmplY3QgRGF0ZV0nO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ2Zvcm1hdCc6IHsgcmVxdWlyZWRGb3JtYXQsIGN1cnJlbnRWYWx1ZSB9IH07XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiAnbWluaW11bScgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIG51bWVyaWMgdmFsdWUgdG8gYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvXG4gICAqIGEgbWluaW11bSBhbW91bnQuXG4gICAqXG4gICAqIEFueSBub24tbnVtZXJpYyB2YWx1ZSBpcyBhbHNvIHZhbGlkIChhY2NvcmRpbmcgdG8gdGhlIEhUTUwgZm9ybXMgc3BlYyxcbiAgICogYSBub24tbnVtZXJpYyB2YWx1ZSBkb2Vzbid0IGhhdmUgYSBtaW5pbXVtKS5cbiAgICogaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjYXR0ci1pbnB1dC1tYXhcbiAgICpcbiAgICogLy8ge251bWJlcn0gbWluaW11bSAtIG1pbmltdW0gYWxsb3dlZCB2YWx1ZVxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxuICAgKi9cbiAgc3RhdGljIG1pbmltdW0obWluaW11bVZhbHVlOiBudW1iZXIpOiBJVmFsaWRhdG9yRm4ge1xuICAgIGlmICghaGFzVmFsdWUobWluaW11bVZhbHVlKSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgY3VycmVudFZhbHVlID0gY29udHJvbC52YWx1ZTtcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSAhaXNOdW1iZXIoY3VycmVudFZhbHVlKSB8fCBjdXJyZW50VmFsdWUgPj0gbWluaW11bVZhbHVlO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ21pbmltdW0nOiB7IG1pbmltdW1WYWx1ZSwgY3VycmVudFZhbHVlIH0gfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqICdleGNsdXNpdmVNaW5pbXVtJyB2YWxpZGF0b3JcbiAgICpcbiAgICogUmVxdWlyZXMgYSBjb250cm9sJ3MgbnVtZXJpYyB2YWx1ZSB0byBiZSBsZXNzIHRoYW4gYSBtYXhpbXVtIGFtb3VudC5cbiAgICpcbiAgICogQW55IG5vbi1udW1lcmljIHZhbHVlIGlzIGFsc28gdmFsaWQgKGFjY29yZGluZyB0byB0aGUgSFRNTCBmb3JtcyBzcGVjLFxuICAgKiBhIG5vbi1udW1lcmljIHZhbHVlIGRvZXNuJ3QgaGF2ZSBhIG1heGltdW0pLlxuICAgKiBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvZm9ybXMuaHRtbCNhdHRyLWlucHV0LW1heFxuICAgKlxuICAgKiAvLyB7bnVtYmVyfSBleGNsdXNpdmVNaW5pbXVtVmFsdWUgLSBtYXhpbXVtIGFsbG93ZWQgdmFsdWVcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyBleGNsdXNpdmVNaW5pbXVtKGV4Y2x1c2l2ZU1pbmltdW1WYWx1ZTogbnVtYmVyKTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIWhhc1ZhbHVlKGV4Y2x1c2l2ZU1pbmltdW1WYWx1ZSkpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwgPT4ge1xuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGNvbnRyb2wudmFsdWU7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gIWlzTnVtYmVyKGN1cnJlbnRWYWx1ZSkgfHwgK2N1cnJlbnRWYWx1ZSA8IGV4Y2x1c2l2ZU1pbmltdW1WYWx1ZTtcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XG4gICAgICAgIG51bGwgOiB7ICdleGNsdXNpdmVNaW5pbXVtJzogeyBleGNsdXNpdmVNaW5pbXVtVmFsdWUsIGN1cnJlbnRWYWx1ZSB9IH07XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiAnbWF4aW11bScgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCdzIG51bWVyaWMgdmFsdWUgdG8gYmUgbGVzcyB0aGFuIG9yIGVxdWFsIHRvXG4gICAqIGEgbWF4aW11bSBhbW91bnQuXG4gICAqXG4gICAqIEFueSBub24tbnVtZXJpYyB2YWx1ZSBpcyBhbHNvIHZhbGlkIChhY2NvcmRpbmcgdG8gdGhlIEhUTUwgZm9ybXMgc3BlYyxcbiAgICogYSBub24tbnVtZXJpYyB2YWx1ZSBkb2Vzbid0IGhhdmUgYSBtYXhpbXVtKS5cbiAgICogaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjYXR0ci1pbnB1dC1tYXhcbiAgICpcbiAgICogLy8ge251bWJlcn0gbWF4aW11bVZhbHVlIC0gbWF4aW11bSBhbGxvd2VkIHZhbHVlXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XG4gICAqL1xuICBzdGF0aWMgbWF4aW11bShtYXhpbXVtVmFsdWU6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFoYXNWYWx1ZShtYXhpbXVtVmFsdWUpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBjb250cm9sLnZhbHVlO1xuICAgICAgY29uc3QgaXNWYWxpZCA9ICFpc051bWJlcihjdXJyZW50VmFsdWUpIHx8ICtjdXJyZW50VmFsdWUgPD0gbWF4aW11bVZhbHVlO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ21heGltdW0nOiB7IG1heGltdW1WYWx1ZSwgY3VycmVudFZhbHVlIH0gfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqICdleGNsdXNpdmVNYXhpbXVtJyB2YWxpZGF0b3JcbiAgICpcbiAgICogUmVxdWlyZXMgYSBjb250cm9sJ3MgbnVtZXJpYyB2YWx1ZSB0byBiZSBsZXNzIHRoYW4gYSBtYXhpbXVtIGFtb3VudC5cbiAgICpcbiAgICogQW55IG5vbi1udW1lcmljIHZhbHVlIGlzIGFsc28gdmFsaWQgKGFjY29yZGluZyB0byB0aGUgSFRNTCBmb3JtcyBzcGVjLFxuICAgKiBhIG5vbi1udW1lcmljIHZhbHVlIGRvZXNuJ3QgaGF2ZSBhIG1heGltdW0pLlxuICAgKiBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvZm9ybXMuaHRtbCNhdHRyLWlucHV0LW1heFxuICAgKlxuICAgKiAvLyB7bnVtYmVyfSBleGNsdXNpdmVNYXhpbXVtVmFsdWUgLSBtYXhpbXVtIGFsbG93ZWQgdmFsdWVcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyBleGNsdXNpdmVNYXhpbXVtKGV4Y2x1c2l2ZU1heGltdW1WYWx1ZTogbnVtYmVyKTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIWhhc1ZhbHVlKGV4Y2x1c2l2ZU1heGltdW1WYWx1ZSkpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwgPT4ge1xuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IGNvbnRyb2wudmFsdWU7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gIWlzTnVtYmVyKGN1cnJlbnRWYWx1ZSkgfHwgK2N1cnJlbnRWYWx1ZSA8IGV4Y2x1c2l2ZU1heGltdW1WYWx1ZTtcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XG4gICAgICAgIG51bGwgOiB7ICdleGNsdXNpdmVNYXhpbXVtJzogeyBleGNsdXNpdmVNYXhpbXVtVmFsdWUsIGN1cnJlbnRWYWx1ZSB9IH07XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiAnbXVsdGlwbGVPZicgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgY29udHJvbCB0byBoYXZlIGEgbnVtZXJpYyB2YWx1ZSB0aGF0IGlzIGEgbXVsdGlwbGVcbiAgICogb2YgYSBzcGVjaWZpZWQgbnVtYmVyLlxuICAgKlxuICAgKiAvLyB7bnVtYmVyfSBtdWx0aXBsZU9mVmFsdWUgLSBudW1iZXIgdmFsdWUgbXVzdCBiZSBhIG11bHRpcGxlIG9mXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbGVPZihtdWx0aXBsZU9mVmFsdWU6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFoYXNWYWx1ZShtdWx0aXBsZU9mVmFsdWUpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCBjdXJyZW50VmFsdWUgPSBjb250cm9sLnZhbHVlO1xuICAgICAgY29uc3QgaXNWYWxpZCA9IGlzTnVtYmVyKGN1cnJlbnRWYWx1ZSkgJiZcbiAgICAgICAgY3VycmVudFZhbHVlICUgbXVsdGlwbGVPZlZhbHVlID09PSAwO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ211bHRpcGxlT2YnOiB7IG11bHRpcGxlT2ZWYWx1ZSwgY3VycmVudFZhbHVlIH0gfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqICdtaW5Qcm9wZXJ0aWVzJyB2YWxpZGF0b3JcbiAgICpcbiAgICogUmVxdWlyZXMgYSBmb3JtIGdyb3VwIHRvIGhhdmUgYSBtaW5pbXVtIG51bWJlciBvZiBwcm9wZXJ0aWVzIChpLmUuIGhhdmVcbiAgICogdmFsdWVzIGVudGVyZWQgaW4gYSBtaW5pbXVtIG51bWJlciBvZiBjb250cm9scyB3aXRoaW4gdGhlIGdyb3VwKS5cbiAgICpcbiAgICogLy8ge251bWJlcn0gbWluaW11bVByb3BlcnRpZXMgLSBtaW5pbXVtIG51bWJlciBvZiBwcm9wZXJ0aWVzIGFsbG93ZWRcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyBtaW5Qcm9wZXJ0aWVzKG1pbmltdW1Qcm9wZXJ0aWVzOiBudW1iZXIpOiBJVmFsaWRhdG9yRm4ge1xuICAgIGlmICghaGFzVmFsdWUobWluaW11bVByb3BlcnRpZXMpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCBjdXJyZW50UHJvcGVydGllcyA9IE9iamVjdC5rZXlzKGNvbnRyb2wudmFsdWUpLmxlbmd0aCB8fCAwO1xuICAgICAgY29uc3QgaXNWYWxpZCA9IGN1cnJlbnRQcm9wZXJ0aWVzID49IG1pbmltdW1Qcm9wZXJ0aWVzO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ21pblByb3BlcnRpZXMnOiB7IG1pbmltdW1Qcm9wZXJ0aWVzLCBjdXJyZW50UHJvcGVydGllcyB9IH07XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiAnbWF4UHJvcGVydGllcycgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIGEgZm9ybSBncm91cCB0byBoYXZlIGEgbWF4aW11bSBudW1iZXIgb2YgcHJvcGVydGllcyAoaS5lLiBoYXZlXG4gICAqIHZhbHVlcyBlbnRlcmVkIGluIGEgbWF4aW11bSBudW1iZXIgb2YgY29udHJvbHMgd2l0aGluIHRoZSBncm91cCkuXG4gICAqXG4gICAqIE5vdGU6IEhhcyBubyBlZmZlY3QgaWYgdGhlIGZvcm0gZ3JvdXAgZG9lcyBub3QgY29udGFpbiBtb3JlIHRoYW4gdGhlXG4gICAqIG1heGltdW0gbnVtYmVyIG9mIGNvbnRyb2xzLlxuICAgKlxuICAgKiAvLyB7bnVtYmVyfSBtYXhpbXVtUHJvcGVydGllcyAtIG1heGltdW0gbnVtYmVyIG9mIHByb3BlcnRpZXMgYWxsb3dlZFxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxuICAgKi9cbiAgc3RhdGljIG1heFByb3BlcnRpZXMobWF4aW11bVByb3BlcnRpZXM6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFoYXNWYWx1ZShtYXhpbXVtUHJvcGVydGllcykpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwgPT4ge1xuICAgICAgY29uc3QgY3VycmVudFByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhjb250cm9sLnZhbHVlKS5sZW5ndGggfHwgMDtcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSBjdXJyZW50UHJvcGVydGllcyA8PSBtYXhpbXVtUHJvcGVydGllcztcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XG4gICAgICAgIG51bGwgOiB7ICdtYXhQcm9wZXJ0aWVzJzogeyBtYXhpbXVtUHJvcGVydGllcywgY3VycmVudFByb3BlcnRpZXMgfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ2RlcGVuZGVuY2llcycgdmFsaWRhdG9yXG4gICAqXG4gICAqIFJlcXVpcmVzIHRoZSBjb250cm9scyBpbiBhIGZvcm0gZ3JvdXAgdG8gbWVldCBhZGRpdGlvbmFsIHZhbGlkYXRpb25cbiAgICogY3JpdGVyaWEsIGRlcGVuZGluZyBvbiB0aGUgdmFsdWVzIG9mIG90aGVyIGNvbnRyb2xzIGluIHRoZSBncm91cC5cbiAgICpcbiAgICogRXhhbXBsZXM6XG4gICAqIGh0dHBzOi8vc3BhY2V0ZWxlc2NvcGUuZ2l0aHViLmlvL3VuZGVyc3RhbmRpbmctanNvbi1zY2hlbWEvcmVmZXJlbmNlL29iamVjdC5odG1sI2RlcGVuZGVuY2llc1xuICAgKlxuICAgKiAvLyB7YW55fSBkZXBlbmRlbmNpZXMgLSByZXF1aXJlZCBkZXBlbmRlbmNpZXNcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyBkZXBlbmRlbmNpZXMoZGVwZW5kZW5jaWVzOiBhbnkpOiBJVmFsaWRhdG9yRm4ge1xuICAgIGlmIChnZXRUeXBlKGRlcGVuZGVuY2llcykgIT09ICdvYmplY3QnIHx8IGlzRW1wdHkoZGVwZW5kZW5jaWVzKSkge1xuICAgICAgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7XG4gICAgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgYWxsRXJyb3JzID0gX21lcmdlT2JqZWN0cyhcbiAgICAgICAgZm9yRWFjaENvcHkoZGVwZW5kZW5jaWVzLCAodmFsdWUsIHJlcXVpcmluZ0ZpZWxkKSA9PiB7XG4gICAgICAgICAgaWYgKCFoYXNWYWx1ZShjb250cm9sLnZhbHVlW3JlcXVpcmluZ0ZpZWxkXSkpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgICAgICBsZXQgcmVxdWlyaW5nRmllbGRFcnJvcnM6IFZhbGlkYXRpb25FcnJvcnMgPSB7IH07XG4gICAgICAgICAgbGV0IHJlcXVpcmVkRmllbGRzOiBzdHJpbmdbXTtcbiAgICAgICAgICBsZXQgcHJvcGVydGllczogVmFsaWRhdGlvbkVycm9ycyA9IHsgfTtcbiAgICAgICAgICBpZiAoZ2V0VHlwZShkZXBlbmRlbmNpZXNbcmVxdWlyaW5nRmllbGRdKSA9PT0gJ2FycmF5Jykge1xuICAgICAgICAgICAgcmVxdWlyZWRGaWVsZHMgPSBkZXBlbmRlbmNpZXNbcmVxdWlyaW5nRmllbGRdO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZ2V0VHlwZShkZXBlbmRlbmNpZXNbcmVxdWlyaW5nRmllbGRdKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIHJlcXVpcmVkRmllbGRzID0gZGVwZW5kZW5jaWVzW3JlcXVpcmluZ0ZpZWxkXVsncmVxdWlyZWQnXSB8fCBbXTtcbiAgICAgICAgICAgIHByb3BlcnRpZXMgPSBkZXBlbmRlbmNpZXNbcmVxdWlyaW5nRmllbGRdWydwcm9wZXJ0aWVzJ10gfHwgeyB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFZhbGlkYXRlIHByb3BlcnR5IGRlcGVuZGVuY2llc1xuICAgICAgICAgIGZvciAoY29uc3QgcmVxdWlyZWRGaWVsZCBvZiByZXF1aXJlZEZpZWxkcykge1xuICAgICAgICAgICAgaWYgKHhvcighaGFzVmFsdWUoY29udHJvbC52YWx1ZVtyZXF1aXJlZEZpZWxkXSksIGludmVydCkpIHtcbiAgICAgICAgICAgICAgcmVxdWlyaW5nRmllbGRFcnJvcnNbcmVxdWlyZWRGaWVsZF0gPSB7ICdyZXF1aXJlZCc6IHRydWUgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBWYWxpZGF0ZSBzY2hlbWEgZGVwZW5kZW5jaWVzXG4gICAgICAgICAgcmVxdWlyaW5nRmllbGRFcnJvcnMgPSBfbWVyZ2VPYmplY3RzKHJlcXVpcmluZ0ZpZWxkRXJyb3JzLFxuICAgICAgICAgICAgZm9yRWFjaENvcHkocHJvcGVydGllcywgKHJlcXVpcmVtZW50cywgcmVxdWlyZWRGaWVsZCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCByZXF1aXJlZEZpZWxkRXJyb3JzID0gX21lcmdlT2JqZWN0cyhcbiAgICAgICAgICAgICAgICBmb3JFYWNoQ29weShyZXF1aXJlbWVudHMsIChyZXF1aXJlbWVudCwgcGFyYW1ldGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgICBsZXQgdmFsaWRhdG9yOiBJVmFsaWRhdG9yRm4gPSBudWxsO1xuICAgICAgICAgICAgICAgICAgaWYgKHJlcXVpcmVtZW50ID09PSAnbWF4aW11bScgfHwgcmVxdWlyZW1lbnQgPT09ICdtaW5pbXVtJykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBleGNsdXNpdmUgPSAhIXJlcXVpcmVtZW50c1snZXhjbHVzaXZlTScgKyByZXF1aXJlbWVudC5zbGljZSgxKV07XG4gICAgICAgICAgICAgICAgICAgIHZhbGlkYXRvciA9IEpzb25WYWxpZGF0b3JzW3JlcXVpcmVtZW50XShwYXJhbWV0ZXIsIGV4Y2x1c2l2ZSk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBKc29uVmFsaWRhdG9yc1tyZXF1aXJlbWVudF0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRhdG9yID0gSnNvblZhbGlkYXRvcnNbcmVxdWlyZW1lbnRdKHBhcmFtZXRlcik7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICByZXR1cm4gIWlzRGVmaW5lZCh2YWxpZGF0b3IpID9cbiAgICAgICAgICAgICAgICAgICAgbnVsbCA6IHZhbGlkYXRvcihjb250cm9sLnZhbHVlW3JlcXVpcmVkRmllbGRdKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICByZXR1cm4gaXNFbXB0eShyZXF1aXJlZEZpZWxkRXJyb3JzKSA/XG4gICAgICAgICAgICAgICAgbnVsbCA6IHsgW3JlcXVpcmVkRmllbGRdOiByZXF1aXJlZEZpZWxkRXJyb3JzIH07XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuIGlzRW1wdHkocmVxdWlyaW5nRmllbGRFcnJvcnMpID9cbiAgICAgICAgICAgIG51bGwgOiB7IFtyZXF1aXJpbmdGaWVsZF06IHJlcXVpcmluZ0ZpZWxkRXJyb3JzIH07XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgcmV0dXJuIGlzRW1wdHkoYWxsRXJyb3JzKSA/IG51bGwgOiBhbGxFcnJvcnM7XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiAnbWluSXRlbXMnIHZhbGlkYXRvclxuICAgKlxuICAgKiBSZXF1aXJlcyBhIGZvcm0gYXJyYXkgdG8gaGF2ZSBhIG1pbmltdW0gbnVtYmVyIG9mIHZhbHVlcy5cbiAgICpcbiAgICogLy8ge251bWJlcn0gbWluaW11bUl0ZW1zIC0gbWluaW11bSBudW1iZXIgb2YgaXRlbXMgYWxsb3dlZFxuICAgKiAvLyB7SVZhbGlkYXRvckZufVxuICAgKi9cbiAgc3RhdGljIG1pbkl0ZW1zKG1pbmltdW1JdGVtczogbnVtYmVyKTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIWhhc1ZhbHVlKG1pbmltdW1JdGVtcykpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwgPT4ge1xuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgIGNvbnN0IGN1cnJlbnRJdGVtcyA9IGlzQXJyYXkoY29udHJvbC52YWx1ZSkgPyBjb250cm9sLnZhbHVlLmxlbmd0aCA6IDA7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gY3VycmVudEl0ZW1zID49IG1pbmltdW1JdGVtcztcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XG4gICAgICAgIG51bGwgOiB7ICdtaW5JdGVtcyc6IHsgbWluaW11bUl0ZW1zLCBjdXJyZW50SXRlbXMgfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ21heEl0ZW1zJyB2YWxpZGF0b3JcbiAgICpcbiAgICogUmVxdWlyZXMgYSBmb3JtIGFycmF5IHRvIGhhdmUgYSBtYXhpbXVtIG51bWJlciBvZiB2YWx1ZXMuXG4gICAqXG4gICAqIC8vIHtudW1iZXJ9IG1heGltdW1JdGVtcyAtIG1heGltdW0gbnVtYmVyIG9mIGl0ZW1zIGFsbG93ZWRcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyBtYXhJdGVtcyhtYXhpbXVtSXRlbXM6IG51bWJlcik6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCFoYXNWYWx1ZShtYXhpbXVtSXRlbXMpKSB7IHJldHVybiBKc29uVmFsaWRhdG9ycy5udWxsVmFsaWRhdG9yOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRJdGVtcyA9IGlzQXJyYXkoY29udHJvbC52YWx1ZSkgPyBjb250cm9sLnZhbHVlLmxlbmd0aCA6IDA7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gY3VycmVudEl0ZW1zIDw9IG1heGltdW1JdGVtcztcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XG4gICAgICAgIG51bGwgOiB7ICdtYXhJdGVtcyc6IHsgbWF4aW11bUl0ZW1zLCBjdXJyZW50SXRlbXMgfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ3VuaXF1ZUl0ZW1zJyB2YWxpZGF0b3JcbiAgICpcbiAgICogUmVxdWlyZXMgdmFsdWVzIGluIGEgZm9ybSBhcnJheSB0byBiZSB1bmlxdWUuXG4gICAqXG4gICAqIC8vIHtib29sZWFuID0gdHJ1ZX0gdW5pcXVlPyAtIHRydWUgdG8gdmFsaWRhdGUsIGZhbHNlIHRvIGRpc2FibGVcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyB1bmlxdWVJdGVtcyh1bmlxdWUgPSB0cnVlKTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIXVuaXF1ZSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3Qgc29ydGVkOiBhbnlbXSA9IGNvbnRyb2wudmFsdWUuc2xpY2UoKS5zb3J0KCk7XG4gICAgICBjb25zdCBkdXBsaWNhdGVJdGVtcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBzb3J0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHNvcnRlZFtpIC0gMV0gPT09IHNvcnRlZFtpXSAmJiBkdXBsaWNhdGVJdGVtcy5pbmNsdWRlcyhzb3J0ZWRbaV0pKSB7XG4gICAgICAgICAgZHVwbGljYXRlSXRlbXMucHVzaChzb3J0ZWRbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBpc1ZhbGlkID0gIWR1cGxpY2F0ZUl0ZW1zLmxlbmd0aDtcbiAgICAgIHJldHVybiB4b3IoaXNWYWxpZCwgaW52ZXJ0KSA/XG4gICAgICAgIG51bGwgOiB7ICd1bmlxdWVJdGVtcyc6IHsgZHVwbGljYXRlSXRlbXMgfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ2NvbnRhaW5zJyB2YWxpZGF0b3JcbiAgICpcbiAgICogVE9ETzogQ29tcGxldGUgdGhpcyB2YWxpZGF0b3JcbiAgICpcbiAgICogUmVxdWlyZXMgdmFsdWVzIGluIGEgZm9ybSBhcnJheSB0byBiZSB1bmlxdWUuXG4gICAqXG4gICAqIC8vIHtib29sZWFuID0gdHJ1ZX0gdW5pcXVlPyAtIHRydWUgdG8gdmFsaWRhdGUsIGZhbHNlIHRvIGRpc2FibGVcbiAgICogLy8ge0lWYWxpZGF0b3JGbn1cbiAgICovXG4gIHN0YXRpYyBjb250YWlucyhyZXF1aXJlZEl0ZW0gPSB0cnVlKTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIXJlcXVpcmVkSXRlbSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSB8fCAhaXNBcnJheShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgY3VycmVudEl0ZW1zID0gY29udHJvbC52YWx1ZTtcbiAgICAgIC8vIGNvbnN0IGlzVmFsaWQgPSBjdXJyZW50SXRlbXMuc29tZShpdGVtID0+XG4gICAgICAvL1xuICAgICAgLy8gKTtcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IHsgJ2NvbnRhaW5zJzogeyByZXF1aXJlZEl0ZW0sIGN1cnJlbnRJdGVtcyB9IH07XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOby1vcCB2YWxpZGF0b3IuIEluY2x1ZGVkIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5LlxuICAgKi9cbiAgc3RhdGljIG51bGxWYWxpZGF0b3IoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogVmFsaWRhdGlvbkVycm9yc3xudWxsIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0b3IgdHJhbnNmb3JtYXRpb24gZnVuY3Rpb25zOlxuICAgKiBjb21wb3NlQW55T2YsIGNvbXBvc2VPbmVPZiwgY29tcG9zZUFsbE9mLCBjb21wb3NlTm90LFxuICAgKiBjb21wb3NlLCBjb21wb3NlQXN5bmNcbiAgICpcbiAgICogVE9ETzogQWRkIGNvbXBvc2VBbnlPZkFzeW5jLCBjb21wb3NlT25lT2ZBc3luYyxcbiAgICogICAgICAgICAgIGNvbXBvc2VBbGxPZkFzeW5jLCBjb21wb3NlTm90QXN5bmNcbiAgICovXG5cbiAgLyoqXG4gICAqICdjb21wb3NlQW55T2YnIHZhbGlkYXRvciBjb21iaW5hdGlvbiBmdW5jdGlvblxuICAgKlxuICAgKiBBY2NlcHRzIGFuIGFycmF5IG9mIHZhbGlkYXRvcnMgYW5kIHJldHVybnMgYSBzaW5nbGUgdmFsaWRhdG9yIHRoYXRcbiAgICogZXZhbHVhdGVzIHRvIHZhbGlkIGlmIGFueSBvbmUgb3IgbW9yZSBvZiB0aGUgc3VibWl0dGVkIHZhbGlkYXRvcnMgYXJlXG4gICAqIHZhbGlkLiBJZiBldmVyeSB2YWxpZGF0b3IgaXMgaW52YWxpZCwgaXQgcmV0dXJucyBjb21iaW5lZCBlcnJvcnMgZnJvbVxuICAgKiBhbGwgdmFsaWRhdG9ycy5cbiAgICpcbiAgICogLy8ge0lWYWxpZGF0b3JGbltdfSB2YWxpZGF0b3JzIC0gYXJyYXkgb2YgdmFsaWRhdG9ycyB0byBjb21iaW5lXG4gICAqIC8vIHtJVmFsaWRhdG9yRm59IC0gc2luZ2xlIGNvbWJpbmVkIHZhbGlkYXRvciBmdW5jdGlvblxuICAgKi9cbiAgc3RhdGljIGNvbXBvc2VBbnlPZih2YWxpZGF0b3JzOiBJVmFsaWRhdG9yRm5bXSk6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCF2YWxpZGF0b3JzKSB7IHJldHVybiBudWxsOyB9XG4gICAgY29uc3QgcHJlc2VudFZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzLmZpbHRlcihpc0RlZmluZWQpO1xuICAgIGlmIChwcmVzZW50VmFsaWRhdG9ycy5sZW5ndGggPT09IDApIHsgcmV0dXJuIG51bGw7IH1cbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwgPT4ge1xuICAgICAgY29uc3QgYXJyYXlPZkVycm9ycyA9XG4gICAgICAgIF9leGVjdXRlVmFsaWRhdG9ycyhjb250cm9sLCBwcmVzZW50VmFsaWRhdG9ycywgaW52ZXJ0KS5maWx0ZXIoaXNEZWZpbmVkKTtcbiAgICAgIGNvbnN0IGlzVmFsaWQgPSB2YWxpZGF0b3JzLmxlbmd0aCA+IGFycmF5T2ZFcnJvcnMubGVuZ3RoO1xuICAgICAgcmV0dXJuIHhvcihpc1ZhbGlkLCBpbnZlcnQpID9cbiAgICAgICAgbnVsbCA6IF9tZXJnZU9iamVjdHMoLi4uYXJyYXlPZkVycm9ycywgeyAnYW55T2YnOiAhaW52ZXJ0IH0pO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ2NvbXBvc2VPbmVPZicgdmFsaWRhdG9yIGNvbWJpbmF0aW9uIGZ1bmN0aW9uXG4gICAqXG4gICAqIEFjY2VwdHMgYW4gYXJyYXkgb2YgdmFsaWRhdG9ycyBhbmQgcmV0dXJucyBhIHNpbmdsZSB2YWxpZGF0b3IgdGhhdFxuICAgKiBldmFsdWF0ZXMgdG8gdmFsaWQgb25seSBpZiBleGFjdGx5IG9uZSBvZiB0aGUgc3VibWl0dGVkIHZhbGlkYXRvcnNcbiAgICogaXMgdmFsaWQuIE90aGVyd2lzZSByZXR1cm5zIGNvbWJpbmVkIGluZm9ybWF0aW9uIGZyb20gYWxsIHZhbGlkYXRvcnMsXG4gICAqIGJvdGggdmFsaWQgYW5kIGludmFsaWQuXG4gICAqXG4gICAqIC8vIHtJVmFsaWRhdG9yRm5bXX0gdmFsaWRhdG9ycyAtIGFycmF5IG9mIHZhbGlkYXRvcnMgdG8gY29tYmluZVxuICAgKiAvLyB7SVZhbGlkYXRvckZufSAtIHNpbmdsZSBjb21iaW5lZCB2YWxpZGF0b3IgZnVuY3Rpb25cbiAgICovXG4gIHN0YXRpYyBjb21wb3NlT25lT2YodmFsaWRhdG9yczogSVZhbGlkYXRvckZuW10pOiBJVmFsaWRhdG9yRm4ge1xuICAgIGlmICghdmFsaWRhdG9ycykgeyByZXR1cm4gbnVsbDsgfVxuICAgIGNvbnN0IHByZXNlbnRWYWxpZGF0b3JzID0gdmFsaWRhdG9ycy5maWx0ZXIoaXNEZWZpbmVkKTtcbiAgICBpZiAocHJlc2VudFZhbGlkYXRvcnMubGVuZ3RoID09PSAwKSB7IHJldHVybiBudWxsOyB9XG4gICAgcmV0dXJuIChjb250cm9sOiBBYnN0cmFjdENvbnRyb2wsIGludmVydCA9IGZhbHNlKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIGNvbnN0IGFycmF5T2ZFcnJvcnMgPVxuICAgICAgICBfZXhlY3V0ZVZhbGlkYXRvcnMoY29udHJvbCwgcHJlc2VudFZhbGlkYXRvcnMpO1xuICAgICAgY29uc3QgdmFsaWRDb250cm9scyA9XG4gICAgICAgIHZhbGlkYXRvcnMubGVuZ3RoIC0gYXJyYXlPZkVycm9ycy5maWx0ZXIoaXNEZWZpbmVkKS5sZW5ndGg7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gdmFsaWRDb250cm9scyA9PT0gMTtcbiAgICAgIGlmICh4b3IoaXNWYWxpZCwgaW52ZXJ0KSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgYXJyYXlPZlZhbGlkcyA9XG4gICAgICAgIF9leGVjdXRlVmFsaWRhdG9ycyhjb250cm9sLCBwcmVzZW50VmFsaWRhdG9ycywgaW52ZXJ0KTtcbiAgICAgIHJldHVybiBfbWVyZ2VPYmplY3RzKC4uLmFycmF5T2ZFcnJvcnMsIC4uLmFycmF5T2ZWYWxpZHMsIHsgJ29uZU9mJzogIWludmVydCB9KTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqICdjb21wb3NlQWxsT2YnIHZhbGlkYXRvciBjb21iaW5hdGlvbiBmdW5jdGlvblxuICAgKlxuICAgKiBBY2NlcHRzIGFuIGFycmF5IG9mIHZhbGlkYXRvcnMgYW5kIHJldHVybnMgYSBzaW5nbGUgdmFsaWRhdG9yIHRoYXRcbiAgICogZXZhbHVhdGVzIHRvIHZhbGlkIG9ubHkgaWYgYWxsIHRoZSBzdWJtaXR0ZWQgdmFsaWRhdG9ycyBhcmUgaW5kaXZpZHVhbGx5XG4gICAqIHZhbGlkLiBPdGhlcndpc2UgaXQgcmV0dXJucyBjb21iaW5lZCBlcnJvcnMgZnJvbSBhbGwgaW52YWxpZCB2YWxpZGF0b3JzLlxuICAgKlxuICAgKiAvLyB7SVZhbGlkYXRvckZuW119IHZhbGlkYXRvcnMgLSBhcnJheSBvZiB2YWxpZGF0b3JzIHRvIGNvbWJpbmVcbiAgICogLy8ge0lWYWxpZGF0b3JGbn0gLSBzaW5nbGUgY29tYmluZWQgdmFsaWRhdG9yIGZ1bmN0aW9uXG4gICAqL1xuICBzdGF0aWMgY29tcG9zZUFsbE9mKHZhbGlkYXRvcnM6IElWYWxpZGF0b3JGbltdKTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIXZhbGlkYXRvcnMpIHsgcmV0dXJuIG51bGw7IH1cbiAgICBjb25zdCBwcmVzZW50VmFsaWRhdG9ycyA9IHZhbGlkYXRvcnMuZmlsdGVyKGlzRGVmaW5lZCk7XG4gICAgaWYgKHByZXNlbnRWYWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gbnVsbDsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBjb25zdCBjb21iaW5lZEVycm9ycyA9IF9tZXJnZUVycm9ycyhcbiAgICAgICAgX2V4ZWN1dGVWYWxpZGF0b3JzKGNvbnRyb2wsIHByZXNlbnRWYWxpZGF0b3JzLCBpbnZlcnQpXG4gICAgICApO1xuICAgICAgY29uc3QgaXNWYWxpZCA9IGNvbWJpbmVkRXJyb3JzID09PSBudWxsO1xuICAgICAgcmV0dXJuICh4b3IoaXNWYWxpZCwgaW52ZXJ0KSkgP1xuICAgICAgICBudWxsIDogX21lcmdlT2JqZWN0cyhjb21iaW5lZEVycm9ycywgeyAnYWxsT2YnOiAhaW52ZXJ0IH0pO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ2NvbXBvc2VOb3QnIHZhbGlkYXRvciBpbnZlcnNpb24gZnVuY3Rpb25cbiAgICpcbiAgICogQWNjZXB0cyBhIHNpbmdsZSB2YWxpZGF0b3IgZnVuY3Rpb24gYW5kIGludmVydHMgaXRzIHJlc3VsdC5cbiAgICogUmV0dXJucyB2YWxpZCBpZiB0aGUgc3VibWl0dGVkIHZhbGlkYXRvciBpcyBpbnZhbGlkLCBhbmRcbiAgICogcmV0dXJucyBpbnZhbGlkIGlmIHRoZSBzdWJtaXR0ZWQgdmFsaWRhdG9yIGlzIHZhbGlkLlxuICAgKiAoTm90ZTogdGhpcyBmdW5jdGlvbiBjYW4gaXRzZWxmIGJlIGludmVydGVkXG4gICAqICAgLSBlLmcuIGNvbXBvc2VOb3QoY29tcG9zZU5vdCh2YWxpZGF0b3IpKSAtXG4gICAqICAgYnV0IHRoaXMgY2FuIGJlIGNvbmZ1c2luZyBhbmQgaXMgdGhlcmVmb3JlIG5vdCByZWNvbW1lbmRlZC4pXG4gICAqXG4gICAqIC8vIHtJVmFsaWRhdG9yRm5bXX0gdmFsaWRhdG9ycyAtIHZhbGlkYXRvcihzKSB0byBpbnZlcnRcbiAgICogLy8ge0lWYWxpZGF0b3JGbn0gLSBuZXcgdmFsaWRhdG9yIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBvcHBvc2l0ZSByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBjb21wb3NlTm90KHZhbGlkYXRvcjogSVZhbGlkYXRvckZuKTogSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIXZhbGlkYXRvcikgeyByZXR1cm4gbnVsbDsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sLCBpbnZlcnQgPSBmYWxzZSk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICBpZiAoaXNFbXB0eShjb250cm9sLnZhbHVlKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgZXJyb3IgPSB2YWxpZGF0b3IoY29udHJvbCwgIWludmVydCk7XG4gICAgICBjb25zdCBpc1ZhbGlkID0gZXJyb3IgPT09IG51bGw7XG4gICAgICByZXR1cm4gKHhvcihpc1ZhbGlkLCBpbnZlcnQpKSA/XG4gICAgICAgIG51bGwgOiBfbWVyZ2VPYmplY3RzKGVycm9yLCB7ICdub3QnOiAhaW52ZXJ0IH0pO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogJ2NvbXBvc2UnIHZhbGlkYXRvciBjb21iaW5hdGlvbiBmdW5jdGlvblxuICAgKlxuICAgKiAvLyB7SVZhbGlkYXRvckZuW119IHZhbGlkYXRvcnMgLSBhcnJheSBvZiB2YWxpZGF0b3JzIHRvIGNvbWJpbmVcbiAgICogLy8ge0lWYWxpZGF0b3JGbn0gLSBzaW5nbGUgY29tYmluZWQgdmFsaWRhdG9yIGZ1bmN0aW9uXG4gICAqL1xuICBzdGF0aWMgY29tcG9zZSh2YWxpZGF0b3JzOiBJVmFsaWRhdG9yRm5bXSk6IElWYWxpZGF0b3JGbiB7XG4gICAgaWYgKCF2YWxpZGF0b3JzKSB7IHJldHVybiBudWxsOyB9XG4gICAgY29uc3QgcHJlc2VudFZhbGlkYXRvcnMgPSB2YWxpZGF0b3JzLmZpbHRlcihpc0RlZmluZWQpO1xuICAgIGlmIChwcmVzZW50VmFsaWRhdG9ycy5sZW5ndGggPT09IDApIHsgcmV0dXJuIG51bGw7IH1cbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCwgaW52ZXJ0ID0gZmFsc2UpOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwgPT5cbiAgICAgIF9tZXJnZUVycm9ycyhfZXhlY3V0ZVZhbGlkYXRvcnMoY29udHJvbCwgcHJlc2VudFZhbGlkYXRvcnMsIGludmVydCkpO1xuICB9XG5cbiAgLyoqXG4gICAqICdjb21wb3NlQXN5bmMnIGFzeW5jIHZhbGlkYXRvciBjb21iaW5hdGlvbiBmdW5jdGlvblxuICAgKlxuICAgKiAvLyB7QXN5bmNJVmFsaWRhdG9yRm5bXX0gYXN5bmMgdmFsaWRhdG9ycyAtIGFycmF5IG9mIGFzeW5jIHZhbGlkYXRvcnNcbiAgICogLy8ge0FzeW5jSVZhbGlkYXRvckZufSAtIHNpbmdsZSBjb21iaW5lZCBhc3luYyB2YWxpZGF0b3IgZnVuY3Rpb25cbiAgICovXG4gIHN0YXRpYyBjb21wb3NlQXN5bmModmFsaWRhdG9yczogQXN5bmNJVmFsaWRhdG9yRm5bXSk6IEFzeW5jSVZhbGlkYXRvckZuIHtcbiAgICBpZiAoIXZhbGlkYXRvcnMpIHsgcmV0dXJuIG51bGw7IH1cbiAgICBjb25zdCBwcmVzZW50VmFsaWRhdG9ycyA9IHZhbGlkYXRvcnMuZmlsdGVyKGlzRGVmaW5lZCk7XG4gICAgaWYgKHByZXNlbnRWYWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm4gbnVsbDsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sKSA9PiB7XG4gICAgICBjb25zdCBvYnNlcnZhYmxlcyA9XG4gICAgICAgIF9leGVjdXRlQXN5bmNWYWxpZGF0b3JzKGNvbnRyb2wsIHByZXNlbnRWYWxpZGF0b3JzKS5tYXAodG9PYnNlcnZhYmxlKTtcbiAgICAgIHJldHVybiBtYXAuY2FsbChmb3JrSm9pbihvYnNlcnZhYmxlcyksIF9tZXJnZUVycm9ycyk7XG4gICAgfTtcbiAgfVxuXG4gIC8vIEFkZGl0aW9uYWwgYW5ndWxhciB2YWxpZGF0b3JzIChub3QgdXNlZCBieSBBbmd1YWxyIEpTT04gU2NoZW1hIEZvcm0pXG4gIC8vIEZyb20gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci9ibG9iL21hc3Rlci9wYWNrYWdlcy9mb3Jtcy9zcmMvdmFsaWRhdG9ycy50c1xuXG4gIC8qKlxuICAgKiBWYWxpZGF0b3IgdGhhdCByZXF1aXJlcyBjb250cm9scyB0byBoYXZlIGEgdmFsdWUgZ3JlYXRlciB0aGFuIGEgbnVtYmVyLlxuICAgKi9cbiAgc3RhdGljIG1pbihtaW46IG51bWJlcik6IFZhbGlkYXRvckZuIHtcbiAgICBpZiAoIWhhc1ZhbHVlKG1pbikpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cbiAgICByZXR1cm4gKGNvbnRyb2w6IEFic3RyYWN0Q29udHJvbCk6IFZhbGlkYXRpb25FcnJvcnN8bnVsbCA9PiB7XG4gICAgICAvLyBkb24ndCB2YWxpZGF0ZSBlbXB0eSB2YWx1ZXMgdG8gYWxsb3cgb3B0aW9uYWwgY29udHJvbHNcbiAgICAgIGlmIChpc0VtcHR5KGNvbnRyb2wudmFsdWUpIHx8IGlzRW1wdHkobWluKSkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgY29uc3QgdmFsdWUgPSBwYXJzZUZsb2F0KGNvbnRyb2wudmFsdWUpO1xuICAgICAgY29uc3QgYWN0dWFsID0gY29udHJvbC52YWx1ZTtcbiAgICAgIC8vIENvbnRyb2xzIHdpdGggTmFOIHZhbHVlcyBhZnRlciBwYXJzaW5nIHNob3VsZCBiZSB0cmVhdGVkIGFzIG5vdCBoYXZpbmcgYVxuICAgICAgLy8gbWluaW11bSwgcGVyIHRoZSBIVE1MIGZvcm1zIHNwZWM6IGh0dHBzOi8vd3d3LnczLm9yZy9UUi9odG1sNS9mb3Jtcy5odG1sI2F0dHItaW5wdXQtbWluXG4gICAgICByZXR1cm4gaXNOYU4odmFsdWUpIHx8IHZhbHVlID49IG1pbiA/IG51bGwgOiB7ICdtaW4nOiB7IG1pbiwgYWN0dWFsIH0gfTtcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRvciB0aGF0IHJlcXVpcmVzIGNvbnRyb2xzIHRvIGhhdmUgYSB2YWx1ZSBsZXNzIHRoYW4gYSBudW1iZXIuXG4gICAqL1xuICBzdGF0aWMgbWF4KG1heDogbnVtYmVyKTogVmFsaWRhdG9yRm4ge1xuICAgIGlmICghaGFzVmFsdWUobWF4KSkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiAoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogVmFsaWRhdGlvbkVycm9yc3xudWxsID0+IHtcbiAgICAgIC8vIGRvbid0IHZhbGlkYXRlIGVtcHR5IHZhbHVlcyB0byBhbGxvdyBvcHRpb25hbCBjb250cm9sc1xuICAgICAgaWYgKGlzRW1wdHkoY29udHJvbC52YWx1ZSkgfHwgaXNFbXB0eShtYXgpKSB7IHJldHVybiBudWxsOyB9XG4gICAgICBjb25zdCB2YWx1ZSA9IHBhcnNlRmxvYXQoY29udHJvbC52YWx1ZSk7XG4gICAgICBjb25zdCBhY3R1YWwgPSBjb250cm9sLnZhbHVlO1xuICAgICAgLy8gQ29udHJvbHMgd2l0aCBOYU4gdmFsdWVzIGFmdGVyIHBhcnNpbmcgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgbm90IGhhdmluZyBhXG4gICAgICAvLyBtYXhpbXVtLCBwZXIgdGhlIEhUTUwgZm9ybXMgc3BlYzogaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjYXR0ci1pbnB1dC1tYXhcbiAgICAgIHJldHVybiBpc05hTih2YWx1ZSkgfHwgdmFsdWUgPD0gbWF4ID8gbnVsbCA6IHsgJ21heCc6IHsgbWF4LCBhY3R1YWwgfSB9O1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdG9yIHRoYXQgcmVxdWlyZXMgY29udHJvbCB2YWx1ZSB0byBiZSB0cnVlLlxuICAgKi9cbiAgc3RhdGljIHJlcXVpcmVkVHJ1ZShjb250cm9sOiBBYnN0cmFjdENvbnRyb2wpOiBWYWxpZGF0aW9uRXJyb3JzfG51bGwge1xuICAgIGlmICghY29udHJvbCkgeyByZXR1cm4gSnNvblZhbGlkYXRvcnMubnVsbFZhbGlkYXRvcjsgfVxuICAgIHJldHVybiBjb250cm9sLnZhbHVlID09PSB0cnVlID8gbnVsbCA6IHsgJ3JlcXVpcmVkJzogdHJ1ZSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRvciB0aGF0IHBlcmZvcm1zIGVtYWlsIHZhbGlkYXRpb24uXG4gICAqL1xuICBzdGF0aWMgZW1haWwoY29udHJvbDogQWJzdHJhY3RDb250cm9sKTogVmFsaWRhdGlvbkVycm9yc3xudWxsIHtcbiAgICBpZiAoIWNvbnRyb2wpIHsgcmV0dXJuIEpzb25WYWxpZGF0b3JzLm51bGxWYWxpZGF0b3I7IH1cbiAgICBjb25zdCBFTUFJTF9SRUdFWFAgPVxuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1saW5lLWxlbmd0aFxuICAgICAgL14oPz0uezEsMjU0fSQpKD89LnsxLDY0fUApWy0hIyQlJicqKy8wLTk9P0EtWl5fYGEtent8fX5dKyhcXC5bLSEjJCUmJyorLzAtOT0/QS1aXl9gYS16e3x9fl0rKSpAW0EtWmEtejAtOV0oW0EtWmEtejAtOS1dezAsNjF9W0EtWmEtejAtOV0pPyhcXC5bQS1aYS16MC05XShbQS1aYS16MC05LV17MCw2MX1bQS1aYS16MC05XSk/KSokLztcbiAgICByZXR1cm4gRU1BSUxfUkVHRVhQLnRlc3QoY29udHJvbC52YWx1ZSkgPyBudWxsIDogeyAnZW1haWwnOiB0cnVlIH07XG4gIH1cbn1cbiJdfQ==