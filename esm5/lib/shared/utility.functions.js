import * as tslib_1 from "tslib";
import { hasValue, inArray, isArray, isDefined, isEmpty, isMap, isObject, isSet, isString } from './validator.functions';
/**
 * Utility function library:
 *
 * addClasses, copy, forEach, forEachCopy, hasOwn, mergeFilteredObject,
 * uniqueItems, commonItems, fixTitle, toTitleCase
*/
/**
 * 'addClasses' function
 *
 * Merges two space-delimited lists of CSS classes and removes duplicates.
 *
 * // {string | string[] | Set<string>} oldClasses
 * // {string | string[] | Set<string>} newClasses
 * // {string | string[] | Set<string>} - Combined classes
 */
export function addClasses(oldClasses, newClasses) {
    var badType = function (i) { return !isSet(i) && !isArray(i) && !isString(i); };
    if (badType(newClasses)) {
        return oldClasses;
    }
    if (badType(oldClasses)) {
        oldClasses = '';
    }
    var toSet = function (i) { return isSet(i) ? i : isArray(i) ? new Set(i) : new Set(i.split(' ')); };
    var combinedSet = toSet(oldClasses);
    var newSet = toSet(newClasses);
    newSet.forEach(function (c) { return combinedSet.add(c); });
    if (isSet(oldClasses)) {
        return combinedSet;
    }
    if (isArray(oldClasses)) {
        return Array.from(combinedSet);
    }
    return Array.from(combinedSet).join(' ');
}
/**
 * 'copy' function
 *
 * Makes a shallow copy of a JavaScript object, array, Map, or Set.
 * If passed a JavaScript primitive value (string, number, boolean, or null),
 * it returns the value.
 *
 * // {Object|Array|string|number|boolean|null} object - The object to copy
 * // {boolean = false} errors - Show errors?
 * // {Object|Array|string|number|boolean|null} - The copied object
 */
export function copy(object, errors) {
    if (errors === void 0) { errors = false; }
    if (typeof object !== 'object' || object === null) {
        return object;
    }
    if (isMap(object)) {
        return new Map(object);
    }
    if (isSet(object)) {
        return new Set(object);
    }
    if (isArray(object)) {
        return tslib_1.__spread(object);
    }
    if (isObject(object)) {
        return tslib_1.__assign({}, object);
    }
    if (errors) {
        console.error('copy error: Object to copy must be a JavaScript object or value.');
    }
    return object;
}
/**
 * 'forEach' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator funciton on each item.
 *
 * The iterator function is called with four values:
 * 1. The current item's value
 * 2. The current item's key
 * 3. The parent object, which contains the current item
 * 4. The root object
 *
 * Setting the optional third parameter to 'top-down' or 'bottom-up' will cause
 * it to also recursively iterate over items in sub-objects or sub-arrays in the
 * specified direction.
 *
 * // {Object|Array} object - The object or array to iterate over
 * // {function} fn - the iterator funciton to call on each item
 * // {boolean = false} errors - Show errors?
 * // {void}
 */
export function forEach(object, fn, recurse, rootObject, errors) {
    if (recurse === void 0) { recurse = false; }
    if (rootObject === void 0) { rootObject = object; }
    if (errors === void 0) { errors = false; }
    var e_1, _a;
    if (isEmpty(object)) {
        return;
    }
    if ((isObject(object) || isArray(object)) && typeof fn === 'function') {
        try {
            for (var _b = tslib_1.__values(Object.keys(object)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                var value = object[key];
                if (recurse === 'bottom-up' && (isObject(value) || isArray(value))) {
                    forEach(value, fn, recurse, rootObject);
                }
                fn(value, key, object, rootObject);
                if (recurse === 'top-down' && (isObject(value) || isArray(value))) {
                    forEach(value, fn, recurse, rootObject);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    if (errors) {
        if (typeof fn !== 'function') {
            console.error('forEach error: Iterator must be a function.');
            console.error('function', fn);
        }
        if (!isObject(object) && !isArray(object)) {
            console.error('forEach error: Input object must be an object or array.');
            console.error('object', object);
        }
    }
}
/**
 * 'forEachCopy' function
 *
 * Iterates over all items in the first level of an object or array
 * and calls an iterator function on each item. Returns a new object or array
 * with the same keys or indexes as the original, and values set to the results
 * of the iterator function.
 *
 * Does NOT recursively iterate over items in sub-objects or sub-arrays.
 *
 * // {Object | Array} object - The object or array to iterate over
 * // {function} fn - The iterator funciton to call on each item
 * // {boolean = false} errors - Show errors?
 * // {Object | Array} - The resulting object or array
 */
export function forEachCopy(object, fn, errors) {
    if (errors === void 0) { errors = false; }
    var e_2, _a;
    if (!hasValue(object)) {
        return;
    }
    if ((isObject(object) || isArray(object)) && typeof object !== 'function') {
        var newObject = isArray(object) ? [] : {};
        try {
            for (var _b = tslib_1.__values(Object.keys(object)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                newObject[key] = fn(object[key], key, object);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return newObject;
    }
    if (errors) {
        if (typeof fn !== 'function') {
            console.error('forEachCopy error: Iterator must be a function.');
            console.error('function', fn);
        }
        if (!isObject(object) && !isArray(object)) {
            console.error('forEachCopy error: Input object must be an object or array.');
            console.error('object', object);
        }
    }
}
/**
 * 'hasOwn' utility function
 *
 * Checks whether an object or array has a particular property.
 *
 * // {any} object - the object to check
 * // {string} property - the property to look for
 * // {boolean} - true if object has property, false if not
 */
export function hasOwn(object, property) {
    if (!object || !['number', 'string', 'symbol'].includes(typeof property) ||
        (!isObject(object) && !isArray(object) && !isMap(object) && !isSet(object))) {
        return false;
    }
    if (isMap(object) || isSet(object)) {
        return object.has(property);
    }
    if (typeof property === 'number') {
        if (isArray(object)) {
            return object[property];
        }
        property = property + '';
    }
    return object.hasOwnProperty(property);
}
/**
 * 'mergeFilteredObject' utility function
 *
 * Shallowly merges two objects, setting key and values from source object
 * in target object, excluding specified keys.
 *
 * Optionally, it can also use functions to transform the key names and/or
 * the values of the merging object.
 *
 * // {PlainObject} targetObject - Target object to add keys and values to
 * // {PlainObject} sourceObject - Source object to copy keys and values from
 * // {string[]} excludeKeys - Array of keys to exclude
 * // {(string: string) => string = (k) => k} keyFn - Function to apply to keys
 * // {(any: any) => any = (v) => v} valueFn - Function to apply to values
 * // {PlainObject} - Returns targetObject
 */
export function mergeFilteredObject(targetObject, sourceObject, excludeKeys, keyFn, valFn) {
    if (excludeKeys === void 0) { excludeKeys = []; }
    if (keyFn === void 0) { keyFn = function (key) { return key; }; }
    if (valFn === void 0) { valFn = function (val) { return val; }; }
    var e_3, _a;
    if (!isObject(sourceObject)) {
        return targetObject;
    }
    if (!isObject(targetObject)) {
        targetObject = {};
    }
    try {
        for (var _b = tslib_1.__values(Object.keys(sourceObject)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            if (!inArray(key, excludeKeys) && isDefined(sourceObject[key])) {
                targetObject[keyFn(key)] = valFn(sourceObject[key]);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return targetObject;
}
/**
 * 'uniqueItems' function
 *
 * Accepts any number of string value inputs,
 * and returns an array of all input vaues, excluding duplicates.
 *
 * // {...string} ...items -
 * // {string[]} -
 */
export function uniqueItems() {
    var items = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        items[_i] = arguments[_i];
    }
    var e_4, _a;
    var returnItems = [];
    try {
        for (var items_1 = tslib_1.__values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
            var item = items_1_1.value;
            if (!returnItems.includes(item)) {
                returnItems.push(item);
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return returnItems;
}
/**
 * 'commonItems' function
 *
 * Accepts any number of strings or arrays of string values,
 * and returns a single array containing only values present in all inputs.
 *
 * // {...string|string[]} ...arrays -
 * // {string[]} -
 */
export function commonItems() {
    var arrays = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        arrays[_i] = arguments[_i];
    }
    var e_5, _a;
    var returnItems = null;
    var _loop_1 = function (array) {
        if (isString(array)) {
            array = [array];
        }
        returnItems = returnItems === null ? tslib_1.__spread(array) :
            returnItems.filter(function (item) { return array.includes(item); });
        if (!returnItems.length) {
            return { value: [] };
        }
    };
    try {
        for (var arrays_1 = tslib_1.__values(arrays), arrays_1_1 = arrays_1.next(); !arrays_1_1.done; arrays_1_1 = arrays_1.next()) {
            var array = arrays_1_1.value;
            var state_1 = _loop_1(array);
            if (typeof state_1 === "object")
                return state_1.value;
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (arrays_1_1 && !arrays_1_1.done && (_a = arrays_1.return)) _a.call(arrays_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
    return returnItems;
}
/**
 * 'fixTitle' function
 *
 *
 * // {string} input -
 * // {string} -
 */
export function fixTitle(name) {
    return name && toTitleCase(name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '));
}
/**
 * 'toTitleCase' function
 *
 * Intelligently converts an input string to Title Case.
 *
 * Accepts an optional second parameter with a list of additional
 * words and abbreviations to force into a particular case.
 *
 * This function is built on prior work by John Gruber and David Gouch:
 * http://daringfireball.net/2008/08/title_case_update
 * https://github.com/gouch/to-title-case
 *
 * // {string} input -
 * // {string|string[]} forceWords? -
 * // {string} -
 */
export function toTitleCase(input, forceWords) {
    if (!isString(input)) {
        return input;
    }
    var forceArray = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'en',
        'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'per', 'the', 'to', 'v', 'v.',
        'vs', 'vs.', 'via'];
    if (isString(forceWords)) {
        forceWords = forceWords.split('|');
    }
    if (isArray(forceWords)) {
        forceArray = forceArray.concat(forceWords);
    }
    var forceArrayLower = forceArray.map(function (w) { return w.toLowerCase(); });
    var noInitialCase = input === input.toUpperCase() || input === input.toLowerCase();
    var prevLastChar = '';
    input = input.trim();
    return input.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function (word, idx) {
        if (!noInitialCase && word.slice(1).search(/[A-Z]|\../) !== -1) {
            return word;
        }
        else {
            var newWord = void 0;
            var forceWord = forceArray[forceArrayLower.indexOf(word.toLowerCase())];
            if (!forceWord) {
                if (noInitialCase) {
                    if (word.slice(1).search(/\../) !== -1) {
                        newWord = word.toLowerCase();
                    }
                    else {
                        newWord = word[0].toUpperCase() + word.slice(1).toLowerCase();
                    }
                }
                else {
                    newWord = word[0].toUpperCase() + word.slice(1);
                }
            }
            else if (forceWord === forceWord.toLowerCase() && (idx === 0 || idx + word.length === input.length ||
                prevLastChar === ':' || input[idx - 1].search(/[^\s-]/) !== -1 ||
                (input[idx - 1] !== '-' && input[idx + word.length] === '-'))) {
                newWord = forceWord[0].toUpperCase() + forceWord.slice(1);
            }
            else {
                newWord = forceWord;
            }
            prevLastChar = word.slice(-1);
            return newWord;
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbGl0eS5mdW5jdGlvbnMuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9hbmd1bGFyNi1qc29uLXNjaGVtYS1mb3JtLyIsInNvdXJjZXMiOlsibGliL3NoYXJlZC91dGlsaXR5LmZ1bmN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUNMLFFBQVEsRUFDUixPQUFPLEVBQ1AsT0FBTyxFQUNQLFNBQVMsRUFDVCxPQUFPLEVBQ1AsS0FBSyxFQUNMLFFBQVEsRUFDUixLQUFLLEVBQ0wsUUFBUSxFQUVQLE1BQU0sdUJBQXVCLENBQUM7QUFFakM7Ozs7O0VBS0U7QUFFRjs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxVQUFVLENBQ3hCLFVBQTJDLEVBQzNDLFVBQTJDO0lBRTNDLElBQU0sT0FBTyxHQUFHLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQXhDLENBQXdDLENBQUM7SUFDOUQsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFBRSxPQUFPLFVBQVUsQ0FBQztLQUFFO0lBQy9DLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQUUsVUFBVSxHQUFHLEVBQUUsQ0FBQztLQUFFO0lBQzdDLElBQU0sS0FBSyxHQUFHLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBOUQsQ0FBOEQsQ0FBQztJQUNsRixJQUFNLFdBQVcsR0FBYSxLQUFLLENBQUMsVUFB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QVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDOUQsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FDN0QsRUFDRDtnQkFDQSxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDM0Q7aUJBQU07Z0JBQ0wsT0FBTyxHQUFHLFNBQVMsQ0FBQzthQUNyQjtZQUNELFlBQVksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsT0FBTyxPQUFPLENBQUM7U0FDaEI7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBoYXNWYWx1ZSxcbiAgaW5BcnJheSxcbiAgaXNBcnJheSxcbiAgaXNEZWZpbmVkLFxuICBpc0VtcHR5LFxuICBpc01hcCxcbiAgaXNPYmplY3QsXG4gIGlzU2V0LFxuICBpc1N0cmluZyxcbiAgUGxhaW5PYmplY3RcbiAgfSBmcm9tICcuL3ZhbGlkYXRvci5mdW5jdGlvbnMnO1xuXG4vKipcbiAqIFV0aWxpdHkgZnVuY3Rpb24gbGlicmFyeTpcbiAqXG4gKiBhZGRDbGFzc2VzLCBjb3B5LCBmb3JFYWNoLCBmb3JFYWNoQ29weSwgaGFzT3duLCBtZXJnZUZpbHRlcmVkT2JqZWN0LFxuICogdW5pcXVlSXRlbXMsIGNvbW1vbkl0ZW1zLCBmaXhUaXRsZSwgdG9UaXRsZUNhc2VcbiovXG5cbi8qKlxuICogJ2FkZENsYXNzZXMnIGZ1bmN0aW9uXG4gKlxuICogTWVyZ2VzIHR3byBzcGFjZS1kZWxpbWl0ZWQgbGlzdHMgb2YgQ1NTIGNsYXNzZXMgYW5kIHJlbW92ZXMgZHVwbGljYXRlcy5cbiAqXG4gKiAvLyB7c3RyaW5nIHwgc3RyaW5nW10gfCBTZXQ8c3RyaW5nPn0gb2xkQ2xhc3Nlc1xuICogLy8ge3N0cmluZyB8IHN0cmluZ1tdIHwgU2V0PHN0cmluZz59IG5ld0NsYXNzZXNcbiAqIC8vIHtzdHJpbmcgfCBzdHJpbmdbXSB8IFNldDxzdHJpbmc+fSAtIENvbWJpbmVkIGNsYXNzZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZENsYXNzZXMoXG4gIG9sZENsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgU2V0PHN0cmluZz4sXG4gIG5ld0NsYXNzZXM6IHN0cmluZyB8IHN0cmluZ1tdIHwgU2V0PHN0cmluZz5cbik6IHN0cmluZyB8IHN0cmluZ1tdIHwgU2V0PHN0cmluZz4ge1xuICBjb25zdCBiYWRUeXBlID0gaSA9PiAhaXNTZXQoaSkgJiYgIWlzQXJyYXkoaSkgJiYgIWlzU3RyaW5nKGkpO1xuICBpZiAoYmFkVHlwZShuZXdDbGFzc2VzKSkgeyByZXR1cm4gb2xkQ2xhc3NlczsgfVxuICBpZiAoYmFkVHlwZShvbGRDbGFzc2VzKSkgeyBvbGRDbGFzc2VzID0gJyc7IH1cbiAgY29uc3QgdG9TZXQgPSBpID0+IGlzU2V0KGkpID8gaSA6IGlzQXJyYXkoaSkgPyBuZXcgU2V0KGkpIDogbmV3IFNldChpLnNwbGl0KCcgJykpO1xuICBjb25zdCBjb21iaW5lZFNldDogU2V0PGFueT4gPSB0b1NldChvbGRDbGFzc2VzKTtcbiAgY29uc3QgbmV3U2V0OiBTZXQ8YW55PiA9IHRvU2V0KG5ld0NsYXNzZXMpO1xuICBuZXdTZXQuZm9yRWFjaChjID0+IGNvbWJpbmVkU2V0LmFkZChjKSk7XG4gIGlmIChpc1NldChvbGRDbGFzc2VzKSkgeyByZXR1cm4gY29tYmluZWRTZXQ7IH1cbiAgaWYgKGlzQXJyYXkob2xkQ2xhc3NlcykpIHsgcmV0dXJuIEFycmF5LmZyb20oY29tYmluZWRTZXQpOyB9XG4gIHJldHVybiBBcnJheS5mcm9tKGNvbWJpbmVkU2V0KS5qb2luKCcgJyk7XG59XG5cbi8qKlxuICogJ2NvcHknIGZ1bmN0aW9uXG4gKlxuICogTWFrZXMgYSBzaGFsbG93IGNvcHkgb2YgYSBKYXZhU2NyaXB0IG9iamVjdCwgYXJyYXksIE1hcCwgb3IgU2V0LlxuICogSWYgcGFzc2VkIGEgSmF2YVNjcmlwdCBwcmltaXRpdmUgdmFsdWUgKHN0cmluZywgbnVtYmVyLCBib29sZWFuLCBvciBudWxsKSxcbiAqIGl0IHJldHVybnMgdGhlIHZhbHVlLlxuICpcbiAqIC8vIHtPYmplY3R8QXJyYXl8c3RyaW5nfG51bWJlcnxib29sZWFufG51bGx9IG9iamVjdCAtIFRoZSBvYmplY3QgdG8gY29weVxuICogLy8ge2Jvb2xlYW4gPSBmYWxzZX0gZXJyb3JzIC0gU2hvdyBlcnJvcnM/XG4gKiAvLyB7T2JqZWN0fEFycmF5fHN0cmluZ3xudW1iZXJ8Ym9vbGVhbnxudWxsfSAtIFRoZSBjb3BpZWQgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb3B5KG9iamVjdDogYW55LCBlcnJvcnMgPSBmYWxzZSk6IGFueSB7XG4gIGlmICh0eXBlb2Ygb2JqZWN0ICE9PSAnb2JqZWN0JyB8fCBvYmplY3QgPT09IG51bGwpIHsgcmV0dXJuIG9iamVjdDsgfVxuICBpZiAoaXNNYXAob2JqZWN0KSkgICAgeyByZXR1cm4gbmV3IE1hcChvYmplY3QpOyB9XG4gIGlmIChpc1NldChvYmplY3QpKSAgICB7IHJldHVybiBuZXcgU2V0KG9iamVjdCk7IH1cbiAgaWYgKGlzQXJyYXkob2JqZWN0KSkgIHsgcmV0dXJuIFsgLi4ub2JqZWN0IF07ICAgfVxuICBpZiAoaXNPYmplY3Qob2JqZWN0KSkgeyByZXR1cm4geyAuLi5vYmplY3QgfTsgICB9XG4gIGlmIChlcnJvcnMpIHtcbiAgICBjb25zb2xlLmVycm9yKCdjb3B5IGVycm9yOiBPYmplY3QgdG8gY29weSBtdXN0IGJlIGEgSmF2YVNjcmlwdCBvYmplY3Qgb3IgdmFsdWUuJyk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxuLyoqXG4gKiAnZm9yRWFjaCcgZnVuY3Rpb25cbiAqXG4gKiBJdGVyYXRlcyBvdmVyIGFsbCBpdGVtcyBpbiB0aGUgZmlyc3QgbGV2ZWwgb2YgYW4gb2JqZWN0IG9yIGFycmF5XG4gKiBhbmQgY2FsbHMgYW4gaXRlcmF0b3IgZnVuY2l0b24gb24gZWFjaCBpdGVtLlxuICpcbiAqIFRoZSBpdGVyYXRvciBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCBmb3VyIHZhbHVlczpcbiAqIDEuIFRoZSBjdXJyZW50IGl0ZW0ncyB2YWx1ZVxuICogMi4gVGhlIGN1cnJlbnQgaXRlbSdzIGtleVxuICogMy4gVGhlIHBhcmVudCBvYmplY3QsIHdoaWNoIGNvbnRhaW5zIHRoZSBjdXJyZW50IGl0ZW1cbiAqIDQuIFRoZSByb290IG9iamVjdFxuICpcbiAqIFNldHRpbmcgdGhlIG9wdGlvbmFsIHRoaXJkIHBhcmFtZXRlciB0byAndG9wLWRvd24nIG9yICdib3R0b20tdXAnIHdpbGwgY2F1c2VcbiAqIGl0IHRvIGFsc28gcmVjdXJzaXZlbHkgaXRlcmF0ZSBvdmVyIGl0ZW1zIGluIHN1Yi1vYmplY3RzIG9yIHN1Yi1hcnJheXMgaW4gdGhlXG4gKiBzcGVjaWZpZWQgZGlyZWN0aW9uLlxuICpcbiAqIC8vIHtPYmplY3R8QXJyYXl9IG9iamVjdCAtIFRoZSBvYmplY3Qgb3IgYXJyYXkgdG8gaXRlcmF0ZSBvdmVyXG4gKiAvLyB7ZnVuY3Rpb259IGZuIC0gdGhlIGl0ZXJhdG9yIGZ1bmNpdG9uIHRvIGNhbGwgb24gZWFjaCBpdGVtXG4gKiAvLyB7Ym9vbGVhbiA9IGZhbHNlfSBlcnJvcnMgLSBTaG93IGVycm9ycz9cbiAqIC8vIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9yRWFjaChcbiAgb2JqZWN0OiBhbnksIGZuOiAodjogYW55LCBrPzogc3RyaW5nIHwgbnVtYmVyLCBjPzogYW55LCByYz86IGFueSkgPT4gYW55LFxuICByZWN1cnNlOiBib29sZWFuIHwgc3RyaW5nID0gZmFsc2UsIHJvb3RPYmplY3Q6IGFueSA9IG9iamVjdCwgZXJyb3JzID0gZmFsc2Vcbik6IHZvaWQge1xuICBpZiAoaXNFbXB0eShvYmplY3QpKSB7IHJldHVybjsgfVxuICBpZiAoKGlzT2JqZWN0KG9iamVjdCkgfHwgaXNBcnJheShvYmplY3QpKSAmJiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmplY3QpKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IG9iamVjdFtrZXldO1xuICAgICAgaWYgKHJlY3Vyc2UgPT09ICdib3R0b20tdXAnICYmIChpc09iamVjdCh2YWx1ZSkgfHwgaXNBcnJheSh2YWx1ZSkpKSB7XG4gICAgICAgIGZvckVhY2godmFsdWUsIGZuLCByZWN1cnNlLCByb290T2JqZWN0KTtcbiAgICAgIH1cbiAgICAgIGZuKHZhbHVlLCBrZXksIG9iamVjdCwgcm9vdE9iamVjdCk7XG4gICAgICBpZiAocmVjdXJzZSA9PT0gJ3RvcC1kb3duJyAmJiAoaXNPYmplY3QodmFsdWUpIHx8IGlzQXJyYXkodmFsdWUpKSkge1xuICAgICAgICBmb3JFYWNoKHZhbHVlLCBmbiwgcmVjdXJzZSwgcm9vdE9iamVjdCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChlcnJvcnMpIHtcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdmb3JFYWNoIGVycm9yOiBJdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgICBjb25zb2xlLmVycm9yKCdmdW5jdGlvbicsIGZuKTtcbiAgICB9XG4gICAgaWYgKCFpc09iamVjdChvYmplY3QpICYmICFpc0FycmF5KG9iamVjdCkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZvckVhY2ggZXJyb3I6IElucHV0IG9iamVjdCBtdXN0IGJlIGFuIG9iamVjdCBvciBhcnJheS4nKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ29iamVjdCcsIG9iamVjdCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogJ2ZvckVhY2hDb3B5JyBmdW5jdGlvblxuICpcbiAqIEl0ZXJhdGVzIG92ZXIgYWxsIGl0ZW1zIGluIHRoZSBmaXJzdCBsZXZlbCBvZiBhbiBvYmplY3Qgb3IgYXJyYXlcbiAqIGFuZCBjYWxscyBhbiBpdGVyYXRvciBmdW5jdGlvbiBvbiBlYWNoIGl0ZW0uIFJldHVybnMgYSBuZXcgb2JqZWN0IG9yIGFycmF5XG4gKiB3aXRoIHRoZSBzYW1lIGtleXMgb3IgaW5kZXhlcyBhcyB0aGUgb3JpZ2luYWwsIGFuZCB2YWx1ZXMgc2V0IHRvIHRoZSByZXN1bHRzXG4gKiBvZiB0aGUgaXRlcmF0b3IgZnVuY3Rpb24uXG4gKlxuICogRG9lcyBOT1QgcmVjdXJzaXZlbHkgaXRlcmF0ZSBvdmVyIGl0ZW1zIGluIHN1Yi1vYmplY3RzIG9yIHN1Yi1hcnJheXMuXG4gKlxuICogLy8ge09iamVjdCB8IEFycmF5fSBvYmplY3QgLSBUaGUgb2JqZWN0IG9yIGFycmF5IHRvIGl0ZXJhdGUgb3ZlclxuICogLy8ge2Z1bmN0aW9ufSBmbiAtIFRoZSBpdGVyYXRvciBmdW5jaXRvbiB0byBjYWxsIG9uIGVhY2ggaXRlbVxuICogLy8ge2Jvb2xlYW4gPSBmYWxzZX0gZXJyb3JzIC0gU2hvdyBlcnJvcnM/XG4gKiAvLyB7T2JqZWN0IHwgQXJyYXl9IC0gVGhlIHJlc3VsdGluZyBvYmplY3Qgb3IgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvckVhY2hDb3B5KFxuICBvYmplY3Q6IGFueSwgZm46ICh2OiBhbnksIGs/OiBzdHJpbmcgfCBudW1iZXIsIG8/OiBhbnksIHA/OiBzdHJpbmcpID0+IGFueSxcbiAgZXJyb3JzID0gZmFsc2Vcbik6IGFueSB7XG4gIGlmICghaGFzVmFsdWUob2JqZWN0KSkgeyByZXR1cm47IH1cbiAgaWYgKChpc09iamVjdChvYmplY3QpIHx8IGlzQXJyYXkob2JqZWN0KSkgJiYgdHlwZW9mIG9iamVjdCAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IG5ld09iamVjdDogYW55ID0gaXNBcnJheShvYmplY3QpID8gW10gOiB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhvYmplY3QpKSB7XG4gICAgICBuZXdPYmplY3Rba2V5XSA9IGZuKG9iamVjdFtrZXldLCBrZXksIG9iamVjdCk7XG4gICAgfVxuICAgIHJldHVybiBuZXdPYmplY3Q7XG4gIH1cbiAgaWYgKGVycm9ycykge1xuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZvckVhY2hDb3B5IGVycm9yOiBJdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24uJyk7XG4gICAgICBjb25zb2xlLmVycm9yKCdmdW5jdGlvbicsIGZuKTtcbiAgICB9XG4gICAgaWYgKCFpc09iamVjdChvYmplY3QpICYmICFpc0FycmF5KG9iamVjdCkpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZvckVhY2hDb3B5IGVycm9yOiBJbnB1dCBvYmplY3QgbXVzdCBiZSBhbiBvYmplY3Qgb3IgYXJyYXkuJyk7XG4gICAgICBjb25zb2xlLmVycm9yKCdvYmplY3QnLCBvYmplY3QpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqICdoYXNPd24nIHV0aWxpdHkgZnVuY3Rpb25cbiAqXG4gKiBDaGVja3Mgd2hldGhlciBhbiBvYmplY3Qgb3IgYXJyYXkgaGFzIGEgcGFydGljdWxhciBwcm9wZXJ0eS5cbiAqXG4gKiAvLyB7YW55fSBvYmplY3QgLSB0aGUgb2JqZWN0IHRvIGNoZWNrXG4gKiAvLyB7c3RyaW5nfSBwcm9wZXJ0eSAtIHRoZSBwcm9wZXJ0eSB0byBsb29rIGZvclxuICogLy8ge2Jvb2xlYW59IC0gdHJ1ZSBpZiBvYmplY3QgaGFzIHByb3BlcnR5LCBmYWxzZSBpZiBub3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc093bihvYmplY3Q6IGFueSwgcHJvcGVydHk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIW9iamVjdCB8fCAhWydudW1iZXInLCAnc3RyaW5nJywgJ3N5bWJvbCddLmluY2x1ZGVzKHR5cGVvZiBwcm9wZXJ0eSkgfHxcbiAgICAoIWlzT2JqZWN0KG9iamVjdCkgJiYgIWlzQXJyYXkob2JqZWN0KSAmJiAhaXNNYXAob2JqZWN0KSAmJiAhaXNTZXQob2JqZWN0KSlcbiAgKSB7IHJldHVybiBmYWxzZTsgfVxuICBpZiAoaXNNYXAob2JqZWN0KSB8fCBpc1NldChvYmplY3QpKSB7IHJldHVybiBvYmplY3QuaGFzKHByb3BlcnR5KTsgfVxuICBpZiAodHlwZW9mIHByb3BlcnR5ID09PSAnbnVtYmVyJykge1xuICAgIGlmIChpc0FycmF5KG9iamVjdCkpIHsgcmV0dXJuIG9iamVjdFs8bnVtYmVyPnByb3BlcnR5XTsgfVxuICAgIHByb3BlcnR5ID0gcHJvcGVydHkgKyAnJztcbiAgfVxuICByZXR1cm4gb2JqZWN0Lmhhc093blByb3BlcnR5KHByb3BlcnR5KTtcbn1cblxuLyoqXG4gKiAnbWVyZ2VGaWx0ZXJlZE9iamVjdCcgdXRpbGl0eSBmdW5jdGlvblxuICpcbiAqIFNoYWxsb3dseSBtZXJnZXMgdHdvIG9iamVjdHMsIHNldHRpbmcga2V5IGFuZCB2YWx1ZXMgZnJvbSBzb3VyY2Ugb2JqZWN0XG4gKiBpbiB0YXJnZXQgb2JqZWN0LCBleGNsdWRpbmcgc3BlY2lmaWVkIGtleXMuXG4gKlxuICogT3B0aW9uYWxseSwgaXQgY2FuIGFsc28gdXNlIGZ1bmN0aW9ucyB0byB0cmFuc2Zvcm0gdGhlIGtleSBuYW1lcyBhbmQvb3JcbiAqIHRoZSB2YWx1ZXMgb2YgdGhlIG1lcmdpbmcgb2JqZWN0LlxuICpcbiAqIC8vIHtQbGFpbk9iamVjdH0gdGFyZ2V0T2JqZWN0IC0gVGFyZ2V0IG9iamVjdCB0byBhZGQga2V5cyBhbmQgdmFsdWVzIHRvXG4gKiAvLyB7UGxhaW5PYmplY3R9IHNvdXJjZU9iamVjdCAtIFNvdXJjZSBvYmplY3QgdG8gY29weSBrZXlzIGFuZCB2YWx1ZXMgZnJvbVxuICogLy8ge3N0cmluZ1tdfSBleGNsdWRlS2V5cyAtIEFycmF5IG9mIGtleXMgdG8gZXhjbHVkZVxuICogLy8geyhzdHJpbmc6IHN0cmluZykgPT4gc3RyaW5nID0gKGspID0+IGt9IGtleUZuIC0gRnVuY3Rpb24gdG8gYXBwbHkgdG8ga2V5c1xuICogLy8geyhhbnk6IGFueSkgPT4gYW55ID0gKHYpID0+IHZ9IHZhbHVlRm4gLSBGdW5jdGlvbiB0byBhcHBseSB0byB2YWx1ZXNcbiAqIC8vIHtQbGFpbk9iamVjdH0gLSBSZXR1cm5zIHRhcmdldE9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VGaWx0ZXJlZE9iamVjdChcbiAgdGFyZ2V0T2JqZWN0OiBQbGFpbk9iamVjdCxcbiAgc291cmNlT2JqZWN0OiBQbGFpbk9iamVjdCxcbiAgZXhjbHVkZUtleXMgPSA8c3RyaW5nW10+W10sXG4gIGtleUZuID0gKGtleTogc3RyaW5nKTogc3RyaW5nID0+IGtleSxcbiAgdmFsRm4gPSAodmFsOiBhbnkpOiBhbnkgPT4gdmFsXG4pOiBQbGFpbk9iamVjdCB7XG4gIGlmICghaXNPYmplY3Qoc291cmNlT2JqZWN0KSkgeyByZXR1cm4gdGFyZ2V0T2JqZWN0OyB9XG4gIGlmICghaXNPYmplY3QodGFyZ2V0T2JqZWN0KSkgeyB0YXJnZXRPYmplY3QgPSB7fTsgfVxuICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhzb3VyY2VPYmplY3QpKSB7XG4gICAgaWYgKCFpbkFycmF5KGtleSwgZXhjbHVkZUtleXMpICYmIGlzRGVmaW5lZChzb3VyY2VPYmplY3Rba2V5XSkpIHtcbiAgICAgIHRhcmdldE9iamVjdFtrZXlGbihrZXkpXSA9IHZhbEZuKHNvdXJjZU9iamVjdFtrZXldKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRhcmdldE9iamVjdDtcbn1cblxuLyoqXG4gKiAndW5pcXVlSXRlbXMnIGZ1bmN0aW9uXG4gKlxuICogQWNjZXB0cyBhbnkgbnVtYmVyIG9mIHN0cmluZyB2YWx1ZSBpbnB1dHMsXG4gKiBhbmQgcmV0dXJucyBhbiBhcnJheSBvZiBhbGwgaW5wdXQgdmF1ZXMsIGV4Y2x1ZGluZyBkdXBsaWNhdGVzLlxuICpcbiAqIC8vIHsuLi5zdHJpbmd9IC4uLml0ZW1zIC1cbiAqIC8vIHtzdHJpbmdbXX0gLVxuICovXG5leHBvcnQgZnVuY3Rpb24gdW5pcXVlSXRlbXMoLi4uaXRlbXMpOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHJldHVybkl0ZW1zID0gW107XG4gIGZvciAoY29uc3QgaXRlbSBvZiBpdGVtcykge1xuICAgIGlmICghcmV0dXJuSXRlbXMuaW5jbHVkZXMoaXRlbSkpIHsgcmV0dXJuSXRlbXMucHVzaChpdGVtKTsgfVxuICB9XG4gIHJldHVybiByZXR1cm5JdGVtcztcbn1cblxuLyoqXG4gKiAnY29tbW9uSXRlbXMnIGZ1bmN0aW9uXG4gKlxuICogQWNjZXB0cyBhbnkgbnVtYmVyIG9mIHN0cmluZ3Mgb3IgYXJyYXlzIG9mIHN0cmluZyB2YWx1ZXMsXG4gKiBhbmQgcmV0dXJucyBhIHNpbmdsZSBhcnJheSBjb250YWluaW5nIG9ubHkgdmFsdWVzIHByZXNlbnQgaW4gYWxsIGlucHV0cy5cbiAqXG4gKiAvLyB7Li4uc3RyaW5nfHN0cmluZ1tdfSAuLi5hcnJheXMgLVxuICogLy8ge3N0cmluZ1tdfSAtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21tb25JdGVtcyguLi5hcnJheXMpOiBzdHJpbmdbXSB7XG4gIGxldCByZXR1cm5JdGVtcyA9IG51bGw7XG4gIGZvciAobGV0IGFycmF5IG9mIGFycmF5cykge1xuICAgIGlmIChpc1N0cmluZyhhcnJheSkpIHsgYXJyYXkgPSBbYXJyYXldOyB9XG4gICAgcmV0dXJuSXRlbXMgPSByZXR1cm5JdGVtcyA9PT0gbnVsbCA/IFsgLi4uYXJyYXkgXSA6XG4gICAgICByZXR1cm5JdGVtcy5maWx0ZXIoaXRlbSA9PiBhcnJheS5pbmNsdWRlcyhpdGVtKSk7XG4gICAgaWYgKCFyZXR1cm5JdGVtcy5sZW5ndGgpIHsgcmV0dXJuIFtdOyB9XG4gIH1cbiAgcmV0dXJuIHJldHVybkl0ZW1zO1xufVxuXG4vKipcbiAqICdmaXhUaXRsZScgZnVuY3Rpb25cbiAqXG4gKlxuICogLy8ge3N0cmluZ30gaW5wdXQgLVxuICogLy8ge3N0cmluZ30gLVxuICovXG5leHBvcnQgZnVuY3Rpb24gZml4VGl0bGUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWUgJiYgdG9UaXRsZUNhc2UobmFtZS5yZXBsYWNlKC8oW2Etel0pKFtBLVpdKS9nLCAnJDEgJDInKS5yZXBsYWNlKC9fL2csICcgJykpO1xufVxuXG4vKipcbiAqICd0b1RpdGxlQ2FzZScgZnVuY3Rpb25cbiAqXG4gKiBJbnRlbGxpZ2VudGx5IGNvbnZlcnRzIGFuIGlucHV0IHN0cmluZyB0byBUaXRsZSBDYXNlLlxuICpcbiAqIEFjY2VwdHMgYW4gb3B0aW9uYWwgc2Vjb25kIHBhcmFtZXRlciB3aXRoIGEgbGlzdCBvZiBhZGRpdGlvbmFsXG4gKiB3b3JkcyBhbmQgYWJicmV2aWF0aW9ucyB0byBmb3JjZSBpbnRvIGEgcGFydGljdWxhciBjYXNlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgYnVpbHQgb24gcHJpb3Igd29yayBieSBKb2huIEdydWJlciBhbmQgRGF2aWQgR291Y2g6XG4gKiBodHRwOi8vZGFyaW5nZmlyZWJhbGwubmV0LzIwMDgvMDgvdGl0bGVfY2FzZV91cGRhdGVcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9nb3VjaC90by10aXRsZS1jYXNlXG4gKlxuICogLy8ge3N0cmluZ30gaW5wdXQgLVxuICogLy8ge3N0cmluZ3xzdHJpbmdbXX0gZm9yY2VXb3Jkcz8gLVxuICogLy8ge3N0cmluZ30gLVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9UaXRsZUNhc2UoaW5wdXQ6IHN0cmluZywgZm9yY2VXb3Jkcz86IHN0cmluZ3xzdHJpbmdbXSk6IHN0cmluZyB7XG4gIGlmICghaXNTdHJpbmcoaW5wdXQpKSB7IHJldHVybiBpbnB1dDsgfVxuICBsZXQgZm9yY2VBcnJheTogc3RyaW5nW10gPSBbJ2EnLCAnYW4nLCAnYW5kJywgJ2FzJywgJ2F0JywgJ2J1dCcsICdieScsICdlbicsXG4gICAnZm9yJywgJ2lmJywgJ2luJywgJ25vcicsICdvZicsICdvbicsICdvcicsICdwZXInLCAndGhlJywgJ3RvJywgJ3YnLCAndi4nLFxuICAgJ3ZzJywgJ3ZzLicsICd2aWEnXTtcbiAgaWYgKGlzU3RyaW5nKGZvcmNlV29yZHMpKSB7IGZvcmNlV29yZHMgPSAoPHN0cmluZz5mb3JjZVdvcmRzKS5zcGxpdCgnfCcpOyB9XG4gIGlmIChpc0FycmF5KGZvcmNlV29yZHMpKSB7IGZvcmNlQXJyYXkgPSBmb3JjZUFycmF5LmNvbmNhdChmb3JjZVdvcmRzKTsgfVxuICBjb25zdCBmb3JjZUFycmF5TG93ZXI6IHN0cmluZ1tdID0gZm9yY2VBcnJheS5tYXAodyA9PiB3LnRvTG93ZXJDYXNlKCkpO1xuICBjb25zdCBub0luaXRpYWxDYXNlOiBib29sZWFuID1cbiAgICBpbnB1dCA9PT0gaW5wdXQudG9VcHBlckNhc2UoKSB8fCBpbnB1dCA9PT0gaW5wdXQudG9Mb3dlckNhc2UoKTtcbiAgbGV0IHByZXZMYXN0Q2hhciA9ICcnO1xuICBpbnB1dCA9IGlucHV0LnRyaW0oKTtcbiAgcmV0dXJuIGlucHV0LnJlcGxhY2UoL1tBLVphLXowLTlcXHUwMEMwLVxcdTAwRkZdK1teXFxzLV0qL2csICh3b3JkLCBpZHgpID0+IHtcbiAgICBpZiAoIW5vSW5pdGlhbENhc2UgJiYgd29yZC5zbGljZSgxKS5zZWFyY2goL1tBLVpdfFxcLi4vKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiB3b3JkO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgbmV3V29yZDogc3RyaW5nO1xuICAgICAgY29uc3QgZm9yY2VXb3JkOiBzdHJpbmcgPVxuICAgICAgICBmb3JjZUFycmF5W2ZvcmNlQXJyYXlMb3dlci5pbmRleE9mKHdvcmQudG9Mb3dlckNhc2UoKSldO1xuICAgICAgaWYgKCFmb3JjZVdvcmQpIHtcbiAgICAgICAgaWYgKG5vSW5pdGlhbENhc2UpIHtcbiAgICAgICAgICBpZiAod29yZC5zbGljZSgxKS5zZWFyY2goL1xcLi4vKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIG5ld1dvcmQgPSB3b3JkLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld1dvcmQgPSB3b3JkWzBdLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld1dvcmQgPSB3b3JkWzBdLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBmb3JjZVdvcmQgPT09IGZvcmNlV29yZC50b0xvd2VyQ2FzZSgpICYmIChcbiAgICAgICAgICBpZHggPT09IDAgfHwgaWR4ICsgd29yZC5sZW5ndGggPT09IGlucHV0Lmxlbmd0aCB8fFxuICAgICAgICAgIHByZXZMYXN0Q2hhciA9PT0gJzonIHx8IGlucHV0W2lkeCAtIDFdLnNlYXJjaCgvW15cXHMtXS8pICE9PSAtMSB8fFxuICAgICAgICAgIChpbnB1dFtpZHggLSAxXSAhPT0gJy0nICYmIGlucHV0W2lkeCArIHdvcmQubGVuZ3RoXSA9PT0gJy0nKVxuICAgICAgICApXG4gICAgICApIHtcbiAgICAgICAgbmV3V29yZCA9IGZvcmNlV29yZFswXS50b1VwcGVyQ2FzZSgpICsgZm9yY2VXb3JkLnNsaWNlKDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3V29yZCA9IGZvcmNlV29yZDtcbiAgICAgIH1cbiAgICAgIHByZXZMYXN0Q2hhciA9IHdvcmQuc2xpY2UoLTEpO1xuICAgICAgcmV0dXJuIG5ld1dvcmQ7XG4gICAgfVxuICB9KTtcbn1cbiJdfQ==