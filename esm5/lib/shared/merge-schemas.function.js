import * as tslib_1 from "tslib";
import _ from 'lodash';
import { isArray, isEmpty, isNumber, isObject, isString } from './validator.functions';
import { hasOwn, uniqueItems, commonItems } from './utility.functions';
/**
 * 'mergeSchemas' function
 *
 * Merges multiple JSON schemas into a single schema with combined rules.
 *
 * If able to logically merge properties from all schemas,
 * returns a single schema object containing all merged properties.
 *
 * Example: ({ a: b, max: 1 }, { c: d, max: 2 }) => { a: b, c: d, max: 1 }
 *
 * If unable to logically merge, returns an allOf schema object containing
 * an array of the original schemas;
 *
 * Example: ({ a: b }, { a: d }) => { allOf: [ { a: b }, { a: d } ] }
 *
 * //   schemas - one or more input schemas
 * //  - merged schema
 */
export function mergeSchemas() {
    var schemas = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        schemas[_i] = arguments[_i];
    }
    var e_1, _a, e_2, _b;
    schemas = schemas.filter(function (schema) { return !isEmpty(schema); });
    if (schemas.some(function (schema) { return !isObject(schema); })) {
        return null;
    }
    var combinedSchema = {};
    try {
        for (var schemas_1 = tslib_1.__values(schemas), schemas_1_1 = schemas_1.next(); !schemas_1_1.done; schemas_1_1 = schemas_1.next()) {
            var schema = schemas_1_1.value;
            var _loop_1 = function (key) {
                var e_3, _a, e_4, _b, e_5, _c, e_6, _d;
                var combinedValue = combinedSchema[key];
                var schemaValue = schema[key];
                if (!hasOwn(combinedSchema, key) || _.isEqual(combinedValue, schemaValue)) {
                    combinedSchema[key] = schemaValue;
                }
                else {
                    switch (key) {
                        case 'allOf':
                            // Combine all items from both arrays
                            if (isArray(combinedValue) && isArray(schemaValue)) {
                                combinedSchema.allOf = mergeSchemas.apply(void 0, tslib_1.__spread(combinedValue, schemaValue));
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'additionalItems':
                        case 'additionalProperties':
                        case 'contains':
                        case 'propertyNames':
                            // Merge schema objects
                            if (isObject(combinedValue) && isObject(schemaValue)) {
                                combinedSchema[key] = mergeSchemas(combinedValue, schemaValue);
                                // additionalProperties == false in any schema overrides all other values
                            }
                            else if (key === 'additionalProperties' &&
                                (combinedValue === false || schemaValue === false)) {
                                combinedSchema.combinedSchema = false;
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'anyOf':
                        case 'oneOf':
                        case 'enum':
                            // Keep only items that appear in both arrays
                            if (isArray(combinedValue) && isArray(schemaValue)) {
                                combinedSchema[key] = combinedValue.filter(function (item1) {
                                    return schemaValue.findIndex(function (item2) { return _.isEqual(item1, item2); }) > -1;
                                });
                                if (!combinedSchema[key].length) {
                                    return { value: { allOf: tslib_1.__spread(schemas) } };
                                }
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'definitions':
                            // Combine keys from both objects
                            if (isObject(combinedValue) && isObject(schemaValue)) {
                                var combinedObject = tslib_1.__assign({}, combinedValue);
                                try {
                                    for (var _e = tslib_1.__values(Object.keys(schemaValue)), _f = _e.next(); !_f.done; _f = _e.next()) {
                                        var subKey = _f.value;
                                        if (!hasOwn(combinedObject, subKey) ||
                                            _.isEqual(combinedObject[subKey], schemaValue[subKey])) {
                                            combinedObject[subKey] = schemaValue[subKey];
                                            // Don't combine matching keys with different values
                                        }
                                        else {
                                            return { value: { allOf: tslib_1.__spread(schemas) } };
                                        }
                                    }
                                }
                                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                finally {
                                    try {
                                        if (_f && !_f.done && (_a = _e.return)) _a.call(_e);
                                    }
                                    finally { if (e_3) throw e_3.error; }
                                }
                                combinedSchema.definitions = combinedObject;
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'dependencies':
                            // Combine all keys from both objects
                            // and merge schemas on matching keys,
                            // converting from arrays to objects if necessary
                            if (isObject(combinedValue) && isObject(schemaValue)) {
                                var combinedObject = tslib_1.__assign({}, combinedValue);
                                try {
                                    for (var _g = tslib_1.__values(Object.keys(schemaValue)), _h = _g.next(); !_h.done; _h = _g.next()) {
                                        var subKey = _h.value;
                                        if (!hasOwn(combinedObject, subKey) ||
                                            _.isEqual(combinedObject[subKey], schemaValue[subKey])) {
                                            combinedObject[subKey] = schemaValue[subKey];
                                            // If both keys are arrays, include all items from both arrays,
                                            // excluding duplicates
                                        }
                                        else if (isArray(schemaValue[subKey]) && isArray(combinedObject[subKey])) {
                                            combinedObject[subKey] = uniqueItems.apply(void 0, tslib_1.__spread(combinedObject[subKey], schemaValue[subKey]));
                                            // If either key is an object, merge the schemas
                                        }
                                        else if ((isArray(schemaValue[subKey]) || isObject(schemaValue[subKey])) &&
                                            (isArray(combinedObject[subKey]) || isObject(combinedObject[subKey]))) {
                                            // If either key is an array, convert it to an object first
                                            var required = isArray(combinedSchema.required) ?
                                                combinedSchema.required : [];
                                            var combinedDependency = isArray(combinedObject[subKey]) ?
                                                { required: uniqueItems.apply(void 0, tslib_1.__spread(required, [combinedObject[subKey]])) } :
                                                combinedObject[subKey];
                                            var schemaDependency = isArray(schemaValue[subKey]) ?
                                                { required: uniqueItems.apply(void 0, tslib_1.__spread(required, [schemaValue[subKey]])) } :
                                                schemaValue[subKey];
                                            combinedObject[subKey] =
                                                mergeSchemas(combinedDependency, schemaDependency);
                                        }
                                        else {
                                            return { value: { allOf: tslib_1.__spread(schemas) } };
                                        }
                                    }
                                }
                                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                                finally {
                                    try {
                                        if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                                    }
                                    finally { if (e_4) throw e_4.error; }
                                }
                                combinedSchema.dependencies = combinedObject;
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'items':
                            // If arrays, keep only items that appear in both arrays
                            if (isArray(combinedValue) && isArray(schemaValue)) {
                                combinedSchema.items = combinedValue.filter(function (item1) {
                                    return schemaValue.findIndex(function (item2) { return _.isEqual(item1, item2); }) > -1;
                                });
                                if (!combinedSchema.items.length) {
                                    return { value: { allOf: tslib_1.__spread(schemas) } };
                                }
                                // If both keys are objects, merge them
                            }
                            else if (isObject(combinedValue) && isObject(schemaValue)) {
                                combinedSchema.items = mergeSchemas(combinedValue, schemaValue);
                                // If object + array, combine object with each array item
                            }
                            else if (isArray(combinedValue) && isObject(schemaValue)) {
                                combinedSchema.items =
                                    combinedValue.map(function (item) { return mergeSchemas(item, schemaValue); });
                            }
                            else if (isObject(combinedValue) && isArray(schemaValue)) {
                                combinedSchema.items =
                                    schemaValue.map(function (item) { return mergeSchemas(item, combinedValue); });
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'multipleOf':
                            // TODO: Adjust to correctly handle decimal values
                            // If numbers, set to least common multiple
                            if (isNumber(combinedValue) && isNumber(schemaValue)) {
                                var gcd_1 = function (x, y) { return !y ? x : gcd_1(y, x % y); };
                                var lcm = function (x, y) { return (x * y) / gcd_1(x, y); };
                                combinedSchema.multipleOf = lcm(combinedValue, schemaValue);
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'maximum':
                        case 'exclusiveMaximum':
                        case 'maxLength':
                        case 'maxItems':
                        case 'maxProperties':
                            // If numbers, set to lowest value
                            if (isNumber(combinedValue) && isNumber(schemaValue)) {
                                combinedSchema[key] = Math.min(combinedValue, schemaValue);
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'minimum':
                        case 'exclusiveMinimum':
                        case 'minLength':
                        case 'minItems':
                        case 'minProperties':
                            // If numbers, set to highest value
                            if (isNumber(combinedValue) && isNumber(schemaValue)) {
                                combinedSchema[key] = Math.max(combinedValue, schemaValue);
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'not':
                            // Combine not values into anyOf array
                            if (isObject(combinedValue) && isObject(schemaValue)) {
                                var notAnyOf = [combinedValue, schemaValue]
                                    .reduce(function (notAnyOfArray, notSchema) {
                                    return isArray(notSchema.anyOf) &&
                                        Object.keys(notSchema).length === 1 ? tslib_1.__spread(notAnyOfArray, notSchema.anyOf) : tslib_1.__spread(notAnyOfArray, [notSchema]);
                                }, []);
                                // TODO: Remove duplicate items from array
                                combinedSchema.not = { anyOf: notAnyOf };
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'patternProperties':
                            // Combine all keys from both objects
                            // and merge schemas on matching keys
                            if (isObject(combinedValue) && isObject(schemaValue)) {
                                var combinedObject = tslib_1.__assign({}, combinedValue);
                                try {
                                    for (var _j = tslib_1.__values(Object.keys(schemaValue)), _k = _j.next(); !_k.done; _k = _j.next()) {
                                        var subKey = _k.value;
                                        if (!hasOwn(combinedObject, subKey) ||
                                            _.isEqual(combinedObject[subKey], schemaValue[subKey])) {
                                            combinedObject[subKey] = schemaValue[subKey];
                                            // If both keys are objects, merge them
                                        }
                                        else if (isObject(schemaValue[subKey]) && isObject(combinedObject[subKey])) {
                                            combinedObject[subKey] =
                                                mergeSchemas(combinedObject[subKey], schemaValue[subKey]);
                                        }
                                        else {
                                            return { value: { allOf: tslib_1.__spread(schemas) } };
                                        }
                                    }
                                }
                                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                                finally {
                                    try {
                                        if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
                                    }
                                    finally { if (e_5) throw e_5.error; }
                                }
                                combinedSchema.patternProperties = combinedObject;
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'properties':
                            // Combine all keys from both objects
                            // unless additionalProperties === false
                            // and merge schemas on matching keys
                            if (isObject(combinedValue) && isObject(schemaValue)) {
                                var combinedObject_1 = tslib_1.__assign({}, combinedValue);
                                // If new schema has additionalProperties,
                                // merge or remove non-matching property keys in combined schema
                                if (hasOwn(schemaValue, 'additionalProperties')) {
                                    Object.keys(combinedValue)
                                        .filter(function (combinedKey) { return !Object.keys(schemaValue).includes(combinedKey); })
                                        .forEach(function (nonMatchingKey) {
                                        if (schemaValue.additionalProperties === false) {
                                            delete combinedObject_1[nonMatchingKey];
                                        }
                                        else if (isObject(schemaValue.additionalProperties)) {
                                            combinedObject_1[nonMatchingKey] = mergeSchemas(combinedObject_1[nonMatchingKey], schemaValue.additionalProperties);
                                        }
                                    });
                                }
                                try {
                                    for (var _l = tslib_1.__values(Object.keys(schemaValue)), _m = _l.next(); !_m.done; _m = _l.next()) {
                                        var subKey = _m.value;
                                        if (_.isEqual(combinedObject_1[subKey], schemaValue[subKey]) || (!hasOwn(combinedObject_1, subKey) &&
                                            !hasOwn(combinedObject_1, 'additionalProperties'))) {
                                            combinedObject_1[subKey] = schemaValue[subKey];
                                            // If combined schema has additionalProperties,
                                            // merge or ignore non-matching property keys in new schema
                                        }
                                        else if (!hasOwn(combinedObject_1, subKey) &&
                                            hasOwn(combinedObject_1, 'additionalProperties')) {
                                            // If combinedObject.additionalProperties === false,
                                            // do nothing (don't set key)
                                            // If additionalProperties is object, merge with new key
                                            if (isObject(combinedObject_1.additionalProperties)) {
                                                combinedObject_1[subKey] = mergeSchemas(combinedObject_1.additionalProperties, schemaValue[subKey]);
                                            }
                                            // If both keys are objects, merge them
                                        }
                                        else if (isObject(schemaValue[subKey]) &&
                                            isObject(combinedObject_1[subKey])) {
                                            combinedObject_1[subKey] =
                                                mergeSchemas(combinedObject_1[subKey], schemaValue[subKey]);
                                        }
                                        else {
                                            return { value: { allOf: tslib_1.__spread(schemas) } };
                                        }
                                    }
                                }
                                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                                finally {
                                    try {
                                        if (_m && !_m.done && (_d = _l.return)) _d.call(_l);
                                    }
                                    finally { if (e_6) throw e_6.error; }
                                }
                                combinedSchema.properties = combinedObject_1;
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'required':
                            // If arrays, include all items from both arrays, excluding duplicates
                            if (isArray(combinedValue) && isArray(schemaValue)) {
                                combinedSchema.required = uniqueItems.apply(void 0, tslib_1.__spread(combinedValue, schemaValue));
                                // If booleans, aet true if either true
                            }
                            else if (typeof schemaValue === 'boolean' &&
                                typeof combinedValue === 'boolean') {
                                combinedSchema.required = !!combinedValue || !!schemaValue;
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'customError':
                        case '$schema':
                        case '$id':
                        case 'id':
                            // Don't combine these keys
                            break;
                        case 'title':
                        case 'description':
                        case '$comment':
                            // Return the last value, overwriting any previous one
                            // These properties are not used for validation, so conflicts don't matter
                            combinedSchema[key] = schemaValue;
                            break;
                        case 'type':
                            if ((isArray(schemaValue) || isString(schemaValue)) &&
                                (isArray(combinedValue) || isString(combinedValue))) {
                                var combinedTypes = commonItems(combinedValue, schemaValue);
                                if (!combinedTypes.length) {
                                    return { value: { allOf: tslib_1.__spread(schemas) } };
                                }
                                combinedSchema.type = combinedTypes.length > 1 ? combinedTypes : combinedTypes[0];
                            }
                            else {
                                return { value: { allOf: tslib_1.__spread(schemas) } };
                            }
                            break;
                        case 'uniqueItems':
                            // Set true if either true
                            combinedSchema.uniqueItems = !!combinedValue || !!schemaValue;
                            break;
                        default: return { value: { allOf: tslib_1.__spread(schemas) } };
                    }
                }
            };
            try {
                for (var _c = tslib_1.__values(Object.keys(schema)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var key = _d.value;
                    var state_1 = _loop_1(key);
                    if (typeof state_1 === "object")
                        return state_1.value;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (schemas_1_1 && !schemas_1_1.done && (_a = schemas_1.return)) _a.call(schemas_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return combinedSchema;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2Utc2NoZW1hcy5mdW5jdGlvbi5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2FuZ3VsYXI2LWpzb24tc2NoZW1hLWZvcm0vIiwic291cmNlcyI6WyJsaWIvc2hhcmVkL21lcmdlLXNjaGVtYXMuZnVuY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sQ0FBQyxNQUFNLFFBQVEsQ0FBQztBQUV2QixPQUFPLEVBQ0wsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFDL0MsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUd2RTs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FpQkc7QUFDSCxNQUFNLFVBQVUsWUFBWTtJQUFDLGlCQUFVO1NBQVYsVUFBVSxFQUFWLHFCQUFVLEVBQVYsSUFBVTtRQUFWLDRCQUFVOzs7SUFDckMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsVUFBQSxNQUFNLElBQUksT0FBQSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBaEIsQ0FBZ0IsQ0FBQyxDQUFDO0lBQ3JELElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sSUFBSSxPQUFBLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFqQixDQUFpQixDQUFDLEVBQUU7UUFBRSxPQUFPLElBQUksQ0FBQztLQUFFO0lBQy9ELElBQU0sY0FBYyxHQUFRLEVBQUUsQ0FBQzs7UUFDL0IsS0FBcUIsSUFBQSxZQUFBLGlCQUFBLE9BQU8sQ0FBQSxnQ0FBQSxxREFBRTtZQUF6QixJQUFNLE1BQU0sb0JBQUE7b0NBQ0osR0FBRzs7Z0JBQ1osSUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUMxQyxJQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2hDLElBQUksQ0FB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LENBQUMsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQzs0QkFDaEUsTUFBTTt3QkFDTixPQUFPLENBQUMsaUJBQ0MsRUFBRSxLQUFLLG1CQUFPLE9BQU8sQ0FBRSxFQUFFLEdBQUM7cUJBQ3BDO2lCQUNGOzs7Z0JBclNILEtBQWtCLElBQUEsS0FBQSxpQkFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBLGdCQUFBO29CQUFoQyxJQUFNLEdBQUcsV0FBQTswQ0FBSCxHQUFHOzs7aUJBc1NiOzs7Ozs7Ozs7U0FDRjs7Ozs7Ozs7O0lBQ0QsT0FBTyxjQUFjLENBQUM7QUFDeEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7XG4gIGlzQXJyYXksIGlzRW1wdHksIGlzTnVtYmVyLCBpc09iamVjdCwgaXNTdHJpbmdcbn0gZnJvbSAnLi92YWxpZGF0b3IuZnVuY3Rpb25zJztcbmltcG9ydCB7IGhhc093biwgdW5pcXVlSXRlbXMsIGNvbW1vbkl0ZW1zIH0gZnJvbSAnLi91dGlsaXR5LmZ1bmN0aW9ucyc7XG5pbXBvcnQgeyBKc29uUG9pbnRlciwgUG9pbnRlciB9IGZyb20gJy4vanNvbnBvaW50ZXIuZnVuY3Rpb25zJztcblxuLyoqXG4gKiAnbWVyZ2VTY2hlbWFzJyBmdW5jdGlvblxuICpcbiAqIE1lcmdlcyBtdWx0aXBsZSBKU09OIHNjaGVtYXMgaW50byBhIHNpbmdsZSBzY2hlbWEgd2l0aCBjb21iaW5lZCBydWxlcy5cbiAqXG4gKiBJZiBhYmxlIHRvIGxvZ2ljYWxseSBtZXJnZSBwcm9wZXJ0aWVzIGZyb20gYWxsIHNjaGVtYXMsXG4gKiByZXR1cm5zIGEgc2luZ2xlIHNjaGVtYSBvYmplY3QgY29udGFpbmluZyBhbGwgbWVyZ2VkIHByb3BlcnRpZXMuXG4gKlxuICogRXhhbXBsZTogKHsgYTogYiwgbWF4OiAxIH0sIHsgYzogZCwgbWF4OiAyIH0pID0+IHsgYTogYiwgYzogZCwgbWF4OiAxIH1cbiAqXG4gKiBJZiB1bmFibGUgdG8gbG9naWNhbGx5IG1lcmdlLCByZXR1cm5zIGFuIGFsbE9mIHNjaGVtYSBvYmplY3QgY29udGFpbmluZ1xuICogYW4gYXJyYXkgb2YgdGhlIG9yaWdpbmFsIHNjaGVtYXM7XG4gKlxuICogRXhhbXBsZTogKHsgYTogYiB9LCB7IGE6IGQgfSkgPT4geyBhbGxPZjogWyB7IGE6IGIgfSwgeyBhOiBkIH0gXSB9XG4gKlxuICogLy8gICBzY2hlbWFzIC0gb25lIG9yIG1vcmUgaW5wdXQgc2NoZW1hc1xuICogLy8gIC0gbWVyZ2VkIHNjaGVtYVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVyZ2VTY2hlbWFzKC4uLnNjaGVtYXMpIHtcbiAgc2NoZW1hcyA9IHNjaGVtYXMuZmlsdGVyKHNjaGVtYSA9PiAhaXNFbXB0eShzY2hlbWEpKTtcbiAgaWYgKHNjaGVtYXMuc29tZShzY2hlbWEgPT4gIWlzT2JqZWN0KHNjaGVtYSkpKSB7IHJldHVybiBudWxsOyB9XG4gIGNvbnN0IGNvbWJpbmVkU2NoZW1hOiBhbnkgPSB7fTtcbiAgZm9yIChjb25zdCBzY2hlbWEgb2Ygc2NoZW1hcykge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHNjaGVtYSkpIHtcbiAgICAgIGNvbnN0IGNvbWJpbmVkVmFsdWUgPSBjb21iaW5lZFNjaGVtYVtrZXldO1xuICAgICAgY29uc3Qgc2NoZW1hVmFsdWUgPSBzY2hlbWFba2V5XTtcbiAgICAgIGlmICghaGFzT3duKGNvbWJpbmVkU2NoZW1hLCBrZXkpIHx8IF8uaXNFcXVhbChjb21iaW5lZFZhbHVlLCBzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgY29tYmluZWRTY2hlbWFba2V5XSA9IHNjaGVtYVZhbHVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChrZXkpIHtcbiAgICAgICAgICBjYXNlICdhbGxPZic6XG4gICAgICAgICAgICAvLyBDb21iaW5lIGFsbCBpdGVtcyBmcm9tIGJvdGggYXJyYXlzXG4gICAgICAgICAgICBpZiAoaXNBcnJheShjb21iaW5lZFZhbHVlKSAmJiBpc0FycmF5KHNjaGVtYVZhbHVlKSkge1xuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5hbGxPZiA9IG1lcmdlU2NoZW1hcyguLi5jb21iaW5lZFZhbHVlLCAuLi5zY2hlbWFWYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdhZGRpdGlvbmFsSXRlbXMnOiBjYXNlICdhZGRpdGlvbmFsUHJvcGVydGllcyc6XG4gICAgICAgICAgY2FzZSAnY29udGFpbnMnOiBjYXNlICdwcm9wZXJ0eU5hbWVzJzpcbiAgICAgICAgICAgIC8vIE1lcmdlIHNjaGVtYSBvYmplY3RzXG4gICAgICAgICAgICBpZiAoaXNPYmplY3QoY29tYmluZWRWYWx1ZSkgJiYgaXNPYmplY3Qoc2NoZW1hVmFsdWUpKSB7XG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hW2tleV0gPSBtZXJnZVNjaGVtYXMoY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpO1xuICAgICAgICAgICAgLy8gYWRkaXRpb25hbFByb3BlcnRpZXMgPT0gZmFsc2UgaW4gYW55IHNjaGVtYSBvdmVycmlkZXMgYWxsIG90aGVyIHZhbHVlc1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAga2V5ID09PSAnYWRkaXRpb25hbFByb3BlcnRpZXMnICYmXG4gICAgICAgICAgICAgIChjb21iaW5lZFZhbHVlID09PSBmYWxzZSB8fCBzY2hlbWFWYWx1ZSA9PT0gZmFsc2UpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEuY29tYmluZWRTY2hlbWEgPSBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2FueU9mJzogY2FzZSAnb25lT2YnOiBjYXNlICdlbnVtJzpcbiAgICAgICAgICAgIC8vIEtlZXAgb25seSBpdGVtcyB0aGF0IGFwcGVhciBpbiBib3RoIGFycmF5c1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkoY29tYmluZWRWYWx1ZSkgJiYgaXNBcnJheShzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWFba2V5XSA9IGNvbWJpbmVkVmFsdWUuZmlsdGVyKGl0ZW0xID0+XG4gICAgICAgICAgICAgICAgc2NoZW1hVmFsdWUuZmluZEluZGV4KGl0ZW0yID0+IF8uaXNFcXVhbChpdGVtMSwgaXRlbTIpKSA+IC0xXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIGlmICghY29tYmluZWRTY2hlbWFba2V5XS5sZW5ndGgpIHsgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07IH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ2RlZmluaXRpb25zJzpcbiAgICAgICAgICAgIC8vIENvbWJpbmUga2V5cyBmcm9tIGJvdGggb2JqZWN0c1xuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KGNvbWJpbmVkVmFsdWUpICYmIGlzT2JqZWN0KHNjaGVtYVZhbHVlKSkge1xuICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZE9iamVjdCA9IHsgLi4uY29tYmluZWRWYWx1ZSB9O1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHN1YktleSBvZiBPYmplY3Qua2V5cyhzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc093bihjb21iaW5lZE9iamVjdCwgc3ViS2V5KSB8fFxuICAgICAgICAgICAgICAgICAgXy5pc0VxdWFsKGNvbWJpbmVkT2JqZWN0W3N1YktleV0sIHNjaGVtYVZhbHVlW3N1YktleV0pXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb21iaW5lZE9iamVjdFtzdWJLZXldID0gc2NoZW1hVmFsdWVbc3ViS2V5XTtcbiAgICAgICAgICAgICAgICAvLyBEb24ndCBjb21iaW5lIG1hdGNoaW5nIGtleXMgd2l0aCBkaWZmZXJlbnQgdmFsdWVzXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5kZWZpbml0aW9ucyA9IGNvbWJpbmVkT2JqZWN0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnZGVwZW5kZW5jaWVzJzpcbiAgICAgICAgICAgIC8vIENvbWJpbmUgYWxsIGtleXMgZnJvbSBib3RoIG9iamVjdHNcbiAgICAgICAgICAgIC8vIGFuZCBtZXJnZSBzY2hlbWFzIG9uIG1hdGNoaW5nIGtleXMsXG4gICAgICAgICAgICAvLyBjb252ZXJ0aW5nIGZyb20gYXJyYXlzIHRvIG9iamVjdHMgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgICBpZiAoaXNPYmplY3QoY29tYmluZWRWYWx1ZSkgJiYgaXNPYmplY3Qoc2NoZW1hVmFsdWUpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbWJpbmVkT2JqZWN0ID0geyAuLi5jb21iaW5lZFZhbHVlIH07XG4gICAgICAgICAgICAgIGZvciAoY29uc3Qgc3ViS2V5IG9mIE9iamVjdC5rZXlzKHNjaGVtYVZhbHVlKSkge1xuICAgICAgICAgICAgICAgIGlmICghaGFzT3duKGNvbWJpbmVkT2JqZWN0LCBzdWJLZXkpIHx8XG4gICAgICAgICAgICAgICAgICBfLmlzRXF1YWwoY29tYmluZWRPYmplY3Rbc3ViS2V5XSwgc2NoZW1hVmFsdWVbc3ViS2V5XSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPSBzY2hlbWFWYWx1ZVtzdWJLZXldO1xuICAgICAgICAgICAgICAgIC8vIElmIGJvdGgga2V5cyBhcmUgYXJyYXlzLCBpbmNsdWRlIGFsbCBpdGVtcyBmcm9tIGJvdGggYXJyYXlzLFxuICAgICAgICAgICAgICAgIC8vIGV4Y2x1ZGluZyBkdXBsaWNhdGVzXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgIGlzQXJyYXkoc2NoZW1hVmFsdWVbc3ViS2V5XSkgJiYgaXNBcnJheShjb21iaW5lZE9iamVjdFtzdWJLZXldKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgY29tYmluZWRPYmplY3Rbc3ViS2V5XSA9XG4gICAgICAgICAgICAgICAgICAgIHVuaXF1ZUl0ZW1zKC4uLmNvbWJpbmVkT2JqZWN0W3N1YktleV0sIC4uLnNjaGVtYVZhbHVlW3N1YktleV0pO1xuICAgICAgICAgICAgICAgIC8vIElmIGVpdGhlciBrZXkgaXMgYW4gb2JqZWN0LCBtZXJnZSB0aGUgc2NoZW1hc1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgICAgICAoaXNBcnJheShzY2hlbWFWYWx1ZVtzdWJLZXldKSB8fCBpc09iamVjdChzY2hlbWFWYWx1ZVtzdWJLZXldKSkgJiZcbiAgICAgICAgICAgICAgICAgIChpc0FycmF5KGNvbWJpbmVkT2JqZWN0W3N1YktleV0pIHx8IGlzT2JqZWN0KGNvbWJpbmVkT2JqZWN0W3N1YktleV0pKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgLy8gSWYgZWl0aGVyIGtleSBpcyBhbiBhcnJheSwgY29udmVydCBpdCB0byBhbiBvYmplY3QgZmlyc3RcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcXVpcmVkID0gaXNBcnJheShjb21iaW5lZFNjaGVtYS5yZXF1aXJlZCkgP1xuICAgICAgICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5yZXF1aXJlZCA6IFtdO1xuICAgICAgICAgICAgICAgICAgY29uc3QgY29tYmluZWREZXBlbmRlbmN5ID0gaXNBcnJheShjb21iaW5lZE9iamVjdFtzdWJLZXldKSA/XG4gICAgICAgICAgICAgICAgICAgIHsgcmVxdWlyZWQ6IHVuaXF1ZUl0ZW1zKC4uLnJlcXVpcmVkLCBjb21iaW5lZE9iamVjdFtzdWJLZXldKSB9IDpcbiAgICAgICAgICAgICAgICAgICAgY29tYmluZWRPYmplY3Rbc3ViS2V5XTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHNjaGVtYURlcGVuZGVuY3kgPSBpc0FycmF5KHNjaGVtYVZhbHVlW3N1YktleV0pID9cbiAgICAgICAgICAgICAgICAgICAgeyByZXF1aXJlZDogdW5pcXVlSXRlbXMoLi4ucmVxdWlyZWQsIHNjaGVtYVZhbHVlW3N1YktleV0pIH0gOlxuICAgICAgICAgICAgICAgICAgICBzY2hlbWFWYWx1ZVtzdWJLZXldO1xuICAgICAgICAgICAgICAgICAgY29tYmluZWRPYmplY3Rbc3ViS2V5XSA9XG4gICAgICAgICAgICAgICAgICAgIG1lcmdlU2NoZW1hcyhjb21iaW5lZERlcGVuZGVuY3ksIHNjaGVtYURlcGVuZGVuY3kpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEuZGVwZW5kZW5jaWVzID0gY29tYmluZWRPYmplY3Q7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdpdGVtcyc6XG4gICAgICAgICAgICAvLyBJZiBhcnJheXMsIGtlZXAgb25seSBpdGVtcyB0aGF0IGFwcGVhciBpbiBib3RoIGFycmF5c1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkoY29tYmluZWRWYWx1ZSkgJiYgaXNBcnJheShzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEuaXRlbXMgPSBjb21iaW5lZFZhbHVlLmZpbHRlcihpdGVtMSA9PlxuICAgICAgICAgICAgICAgIHNjaGVtYVZhbHVlLmZpbmRJbmRleChpdGVtMiA9PiBfLmlzRXF1YWwoaXRlbTEsIGl0ZW0yKSkgPiAtMVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICBpZiAoIWNvbWJpbmVkU2NoZW1hLml0ZW1zLmxlbmd0aCkgeyByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTsgfVxuICAgICAgICAgICAgLy8gSWYgYm90aCBrZXlzIGFyZSBvYmplY3RzLCBtZXJnZSB0aGVtXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGNvbWJpbmVkVmFsdWUpICYmIGlzT2JqZWN0KHNjaGVtYVZhbHVlKSkge1xuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5pdGVtcyA9IG1lcmdlU2NoZW1hcyhjb21iaW5lZFZhbHVlLCBzY2hlbWFWYWx1ZSk7XG4gICAgICAgICAgICAvLyBJZiBvYmplY3QgKyBhcnJheSwgY29tYmluZSBvYmplY3Qgd2l0aCBlYWNoIGFycmF5IGl0ZW1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb21iaW5lZFZhbHVlKSAmJiBpc09iamVjdChzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEuaXRlbXMgPVxuICAgICAgICAgICAgICAgIGNvbWJpbmVkVmFsdWUubWFwKGl0ZW0gPT4gbWVyZ2VTY2hlbWFzKGl0ZW0sIHNjaGVtYVZhbHVlKSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KGNvbWJpbmVkVmFsdWUpICYmIGlzQXJyYXkoc2NoZW1hVmFsdWUpKSB7XG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hLml0ZW1zID1cbiAgICAgICAgICAgICAgICBzY2hlbWFWYWx1ZS5tYXAoaXRlbSA9PiBtZXJnZVNjaGVtYXMoaXRlbSwgY29tYmluZWRWYWx1ZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbXVsdGlwbGVPZic6XG4gICAgICAgICAgICAvLyBUT0RPOiBBZGp1c3QgdG8gY29ycmVjdGx5IGhhbmRsZSBkZWNpbWFsIHZhbHVlc1xuICAgICAgICAgICAgLy8gSWYgbnVtYmVycywgc2V0IHRvIGxlYXN0IGNvbW1vbiBtdWx0aXBsZVxuICAgICAgICAgICAgaWYgKGlzTnVtYmVyKGNvbWJpbmVkVmFsdWUpICYmIGlzTnVtYmVyKHNjaGVtYVZhbHVlKSkge1xuICAgICAgICAgICAgICBjb25zdCBnY2QgPSAoeCwgeSkgPT4gIXkgPyB4IDogZ2NkKHksIHggJSB5KTtcbiAgICAgICAgICAgICAgY29uc3QgbGNtID0gKHgsIHkpID0+ICh4ICogeSkgLyBnY2QoeCwgeSk7XG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hLm11bHRpcGxlT2YgPSBsY20oY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbWF4aW11bSc6IGNhc2UgJ2V4Y2x1c2l2ZU1heGltdW0nOiBjYXNlICdtYXhMZW5ndGgnOlxuICAgICAgICAgIGNhc2UgJ21heEl0ZW1zJzogY2FzZSAnbWF4UHJvcGVydGllcyc6XG4gICAgICAgICAgICAvLyBJZiBudW1iZXJzLCBzZXQgdG8gbG93ZXN0IHZhbHVlXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIoY29tYmluZWRWYWx1ZSkgJiYgaXNOdW1iZXIoc2NoZW1hVmFsdWUpKSB7XG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hW2tleV0gPSBNYXRoLm1pbihjb21iaW5lZFZhbHVlLCBzY2hlbWFWYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdtaW5pbXVtJzogY2FzZSAnZXhjbHVzaXZlTWluaW11bSc6IGNhc2UgJ21pbkxlbmd0aCc6XG4gICAgICAgICAgY2FzZSAnbWluSXRlbXMnOiBjYXNlICdtaW5Qcm9wZXJ0aWVzJzpcbiAgICAgICAgICAgIC8vIElmIG51bWJlcnMsIHNldCB0byBoaWdoZXN0IHZhbHVlXG4gICAgICAgICAgICBpZiAoaXNOdW1iZXIoY29tYmluZWRWYWx1ZSkgJiYgaXNOdW1iZXIoc2NoZW1hVmFsdWUpKSB7XG4gICAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hW2tleV0gPSBNYXRoLm1heChjb21iaW5lZFZhbHVlLCBzY2hlbWFWYWx1ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdub3QnOlxuICAgICAgICAgICAgLy8gQ29tYmluZSBub3QgdmFsdWVzIGludG8gYW55T2YgYXJyYXlcbiAgICAgICAgICAgIGlmIChpc09iamVjdChjb21iaW5lZFZhbHVlKSAmJiBpc09iamVjdChzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgY29uc3Qgbm90QW55T2YgPSBbY29tYmluZWRWYWx1ZSwgc2NoZW1hVmFsdWVdXG4gICAgICAgICAgICAgICAgLnJlZHVjZSgobm90QW55T2ZBcnJheSwgbm90U2NoZW1hKSA9PlxuICAgICAgICAgICAgICAgICAgaXNBcnJheShub3RTY2hlbWEuYW55T2YpICYmXG4gICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhub3RTY2hlbWEpLmxlbmd0aCA9PT0gMSA/XG4gICAgICAgICAgICAgICAgICAgIFsgLi4ubm90QW55T2ZBcnJheSwgLi4ubm90U2NoZW1hLmFueU9mIF0gOlxuICAgICAgICAgICAgICAgICAgICBbIC4uLm5vdEFueU9mQXJyYXksIG5vdFNjaGVtYSBdXG4gICAgICAgICAgICAgICAgLCBbXSk7XG4gICAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSBkdXBsaWNhdGUgaXRlbXMgZnJvbSBhcnJheVxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5ub3QgPSB7IGFueU9mOiBub3RBbnlPZiB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncGF0dGVyblByb3BlcnRpZXMnOlxuICAgICAgICAgICAgLy8gQ29tYmluZSBhbGwga2V5cyBmcm9tIGJvdGggb2JqZWN0c1xuICAgICAgICAgICAgLy8gYW5kIG1lcmdlIHNjaGVtYXMgb24gbWF0Y2hpbmcga2V5c1xuICAgICAgICAgICAgaWYgKGlzT2JqZWN0KGNvbWJpbmVkVmFsdWUpICYmIGlzT2JqZWN0KHNjaGVtYVZhbHVlKSkge1xuICAgICAgICAgICAgICBjb25zdCBjb21iaW5lZE9iamVjdCA9IHsgLi4uY29tYmluZWRWYWx1ZSB9O1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHN1YktleSBvZiBPYmplY3Qua2V5cyhzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWhhc093bihjb21iaW5lZE9iamVjdCwgc3ViS2V5KSB8fFxuICAgICAgICAgICAgICAgICAgXy5pc0VxdWFsKGNvbWJpbmVkT2JqZWN0W3N1YktleV0sIHNjaGVtYVZhbHVlW3N1YktleV0pXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb21iaW5lZE9iamVjdFtzdWJLZXldID0gc2NoZW1hVmFsdWVbc3ViS2V5XTtcbiAgICAgICAgICAgICAgICAvLyBJZiBib3RoIGtleXMgYXJlIG9iamVjdHMsIG1lcmdlIHRoZW1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgaXNPYmplY3Qoc2NoZW1hVmFsdWVbc3ViS2V5XSkgJiYgaXNPYmplY3QoY29tYmluZWRPYmplY3Rbc3ViS2V5XSlcbiAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPVxuICAgICAgICAgICAgICAgICAgICBtZXJnZVNjaGVtYXMoY29tYmluZWRPYmplY3Rbc3ViS2V5XSwgc2NoZW1hVmFsdWVbc3ViS2V5XSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5wYXR0ZXJuUHJvcGVydGllcyA9IGNvbWJpbmVkT2JqZWN0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncHJvcGVydGllcyc6XG4gICAgICAgICAgICAvLyBDb21iaW5lIGFsbCBrZXlzIGZyb20gYm90aCBvYmplY3RzXG4gICAgICAgICAgICAvLyB1bmxlc3MgYWRkaXRpb25hbFByb3BlcnRpZXMgPT09IGZhbHNlXG4gICAgICAgICAgICAvLyBhbmQgbWVyZ2Ugc2NoZW1hcyBvbiBtYXRjaGluZyBrZXlzXG4gICAgICAgICAgICBpZiAoaXNPYmplY3QoY29tYmluZWRWYWx1ZSkgJiYgaXNPYmplY3Qoc2NoZW1hVmFsdWUpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbWJpbmVkT2JqZWN0ID0geyAuLi5jb21iaW5lZFZhbHVlIH07XG4gICAgICAgICAgICAgIC8vIElmIG5ldyBzY2hlbWEgaGFzIGFkZGl0aW9uYWxQcm9wZXJ0aWVzLFxuICAgICAgICAgICAgICAvLyBtZXJnZSBvciByZW1vdmUgbm9uLW1hdGNoaW5nIHByb3BlcnR5IGtleXMgaW4gY29tYmluZWQgc2NoZW1hXG4gICAgICAgICAgICAgIGlmIChoYXNPd24oc2NoZW1hVmFsdWUsICdhZGRpdGlvbmFsUHJvcGVydGllcycpKSB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoY29tYmluZWRWYWx1ZSlcbiAgICAgICAgICAgICAgICAgIC5maWx0ZXIoY29tYmluZWRLZXkgPT4gIU9iamVjdC5rZXlzKHNjaGVtYVZhbHVlKS5pbmNsdWRlcyhjb21iaW5lZEtleSkpXG4gICAgICAgICAgICAgICAgICAuZm9yRWFjaChub25NYXRjaGluZ0tleSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2hlbWFWYWx1ZS5hZGRpdGlvbmFsUHJvcGVydGllcyA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgY29tYmluZWRPYmplY3Rbbm9uTWF0Y2hpbmdLZXldO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2JqZWN0KHNjaGVtYVZhbHVlLmFkZGl0aW9uYWxQcm9wZXJ0aWVzKSkge1xuICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W25vbk1hdGNoaW5nS2V5XSA9IG1lcmdlU2NoZW1hcyhcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W25vbk1hdGNoaW5nS2V5XSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaGVtYVZhbHVlLmFkZGl0aW9uYWxQcm9wZXJ0aWVzXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9yIChjb25zdCBzdWJLZXkgb2YgT2JqZWN0LmtleXMoc2NoZW1hVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgaWYgKF8uaXNFcXVhbChjb21iaW5lZE9iamVjdFtzdWJLZXldLCBzY2hlbWFWYWx1ZVtzdWJLZXldKSB8fCAoXG4gICAgICAgICAgICAgICAgICAhaGFzT3duKGNvbWJpbmVkT2JqZWN0LCBzdWJLZXkpICYmXG4gICAgICAgICAgICAgICAgICAhaGFzT3duKGNvbWJpbmVkT2JqZWN0LCAnYWRkaXRpb25hbFByb3BlcnRpZXMnKVxuICAgICAgICAgICAgICAgICkpIHtcbiAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPSBzY2hlbWFWYWx1ZVtzdWJLZXldO1xuICAgICAgICAgICAgICAgIC8vIElmIGNvbWJpbmVkIHNjaGVtYSBoYXMgYWRkaXRpb25hbFByb3BlcnRpZXMsXG4gICAgICAgICAgICAgICAgLy8gbWVyZ2Ugb3IgaWdub3JlIG5vbi1tYXRjaGluZyBwcm9wZXJ0eSBrZXlzIGluIG5ldyBzY2hlbWFcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgIWhhc093bihjb21iaW5lZE9iamVjdCwgc3ViS2V5KSAmJlxuICAgICAgICAgICAgICAgICAgaGFzT3duKGNvbWJpbmVkT2JqZWN0LCAnYWRkaXRpb25hbFByb3BlcnRpZXMnKVxuICAgICAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgICAgLy8gSWYgY29tYmluZWRPYmplY3QuYWRkaXRpb25hbFByb3BlcnRpZXMgPT09IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgLy8gZG8gbm90aGluZyAoZG9uJ3Qgc2V0IGtleSlcbiAgICAgICAgICAgICAgICAgIC8vIElmIGFkZGl0aW9uYWxQcm9wZXJ0aWVzIGlzIG9iamVjdCwgbWVyZ2Ugd2l0aCBuZXcga2V5XG4gICAgICAgICAgICAgICAgICBpZiAoaXNPYmplY3QoY29tYmluZWRPYmplY3QuYWRkaXRpb25hbFByb3BlcnRpZXMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbWJpbmVkT2JqZWN0W3N1YktleV0gPSBtZXJnZVNjaGVtYXMoXG4gICAgICAgICAgICAgICAgICAgICAgY29tYmluZWRPYmplY3QuYWRkaXRpb25hbFByb3BlcnRpZXMsIHNjaGVtYVZhbHVlW3N1YktleV1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBJZiBib3RoIGtleXMgYXJlIG9iamVjdHMsIG1lcmdlIHRoZW1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICAgICAgaXNPYmplY3Qoc2NoZW1hVmFsdWVbc3ViS2V5XSkgJiZcbiAgICAgICAgICAgICAgICAgIGlzT2JqZWN0KGNvbWJpbmVkT2JqZWN0W3N1YktleV0pXG4gICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICBjb21iaW5lZE9iamVjdFtzdWJLZXldID1cbiAgICAgICAgICAgICAgICAgICAgbWVyZ2VTY2hlbWFzKGNvbWJpbmVkT2JqZWN0W3N1YktleV0sIHNjaGVtYVZhbHVlW3N1YktleV0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4geyBhbGxPZjogWyAuLi5zY2hlbWFzIF0gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEucHJvcGVydGllcyA9IGNvbWJpbmVkT2JqZWN0O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAncmVxdWlyZWQnOlxuICAgICAgICAgICAgLy8gSWYgYXJyYXlzLCBpbmNsdWRlIGFsbCBpdGVtcyBmcm9tIGJvdGggYXJyYXlzLCBleGNsdWRpbmcgZHVwbGljYXRlc1xuICAgICAgICAgICAgaWYgKGlzQXJyYXkoY29tYmluZWRWYWx1ZSkgJiYgaXNBcnJheShzY2hlbWFWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEucmVxdWlyZWQgPSB1bmlxdWVJdGVtcyguLi5jb21iaW5lZFZhbHVlLCAuLi5zY2hlbWFWYWx1ZSk7XG4gICAgICAgICAgICAvLyBJZiBib29sZWFucywgYWV0IHRydWUgaWYgZWl0aGVyIHRydWVcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHR5cGVvZiBzY2hlbWFWYWx1ZSA9PT0gJ2Jvb2xlYW4nICYmXG4gICAgICAgICAgICAgIHR5cGVvZiBjb21iaW5lZFZhbHVlID09PSAnYm9vbGVhbidcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICBjb21iaW5lZFNjaGVtYS5yZXF1aXJlZCA9ICEhY29tYmluZWRWYWx1ZSB8fCAhIXNjaGVtYVZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnJHNjaGVtYSc6IGNhc2UgJyRpZCc6IGNhc2UgJ2lkJzpcbiAgICAgICAgICAgIC8vIERvbid0IGNvbWJpbmUgdGhlc2Uga2V5c1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ3RpdGxlJzogY2FzZSAnZGVzY3JpcHRpb24nOiBjYXNlICckY29tbWVudCc6XG4gICAgICAgICAgICAvLyBSZXR1cm4gdGhlIGxhc3QgdmFsdWUsIG92ZXJ3cml0aW5nIGFueSBwcmV2aW91cyBvbmVcbiAgICAgICAgICAgIC8vIFRoZXNlIHByb3BlcnRpZXMgYXJlIG5vdCB1c2VkIGZvciB2YWxpZGF0aW9uLCBzbyBjb25mbGljdHMgZG9uJ3QgbWF0dGVyXG4gICAgICAgICAgICBjb21iaW5lZFNjaGVtYVtrZXldID0gc2NoZW1hVmFsdWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAndHlwZSc6XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChpc0FycmF5KHNjaGVtYVZhbHVlKSB8fCBpc1N0cmluZyhzY2hlbWFWYWx1ZSkpICYmXG4gICAgICAgICAgICAgIChpc0FycmF5KGNvbWJpbmVkVmFsdWUpIHx8IGlzU3RyaW5nKGNvbWJpbmVkVmFsdWUpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbWJpbmVkVHlwZXMgPSBjb21tb25JdGVtcyhjb21iaW5lZFZhbHVlLCBzY2hlbWFWYWx1ZSk7XG4gICAgICAgICAgICAgIGlmICghY29tYmluZWRUeXBlcy5sZW5ndGgpIHsgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07IH1cbiAgICAgICAgICAgICAgY29tYmluZWRTY2hlbWEudHlwZSA9IGNvbWJpbmVkVHlwZXMubGVuZ3RoID4gMSA/IGNvbWJpbmVkVHlwZXMgOiBjb21iaW5lZFR5cGVzWzBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgYWxsT2Y6IFsgLi4uc2NoZW1hcyBdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAndW5pcXVlSXRlbXMnOlxuICAgICAgICAgICAgLy8gU2V0IHRydWUgaWYgZWl0aGVyIHRydWVcbiAgICAgICAgICAgIGNvbWJpbmVkU2NoZW1hLnVuaXF1ZUl0ZW1zID0gISFjb21iaW5lZFZhbHVlIHx8ICEhc2NoZW1hVmFsdWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiB7IGFsbE9mOiBbIC4uLnNjaGVtYXMgXSB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBjb21iaW5lZFNjaGVtYTtcbn1cbiJdfQ==