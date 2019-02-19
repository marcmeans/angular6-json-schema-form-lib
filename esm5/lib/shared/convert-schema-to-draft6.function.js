import * as tslib_1 from "tslib";
import _ from 'lodash';
export function convertSchemaToDraft6(schema, options) {
    if (options === void 0) { options = {}; }
    var e_1, _a;
    var draft = options.draft || null;
    var changed = options.changed || false;
    if (typeof schema !== 'object') {
        return schema;
    }
    if (typeof schema.map === 'function') {
        return tslib_1.__spread(schema.map(function (subSchema) { return convertSchemaToDraft6(subSchema, { changed: changed, draft: draft }); }));
    }
    var newSchema = tslib_1.__assign({}, schema);
    var simpleTypes = ['array', 'boolean', 'integer', 'null', 'number', 'object', 'string'];
    if (typeof newSchema.$schema === 'string' &&
        /http\:\/\/json\-schema\.org\/draft\-0\d\/schema\#/.test(newSchema.$schema)) {
        draft = newSchema.$schema[30];
    }
    // Convert v1-v2 'contentEncoding' to 'media.binaryEncoding'
    // Note: This is only used in JSON hyper-schema (not regular JSON schema)
    if (newSchema.contentEncoding) {
        newSchema.media = { binaryEncoding: newSchema.contentEncoding };
        delete newSchema.contentEncoding;
        changed = true;
    }
    // Convert v1-v3 'extends' to 'allOf'
    if (typeof newSchema.extends === 'object') {
        newSchema.allOf = typeof newSchema.extends.map === 'function' ?
            newSchema.extends.map(function (subSchema) { return convertSchemaToDraft6(subSchema, { changed: changed, draft: draft }); }) :
            [convertSchemaToDraft6(newSchema.extends, { changed: changed, draft: draft })];
        delete newSchema.extends;
        changed = true;
    }
    // Convert v1-v3 'disallow' to 'not'
    if (newSchema.disallow) {
        if (typeof newSchema.disallow === 'string') {
            newSchema.not = { type: newSchema.disallow };
        }
        else if (typeof newSchema.disallow.map === 'function') {
            newSchema.not = {
                anyOf: newSchema.disallow
                    .map(function (type) { return typeof type === 'object' ? type : { type: type }; })
            };
        }
        delete newSchema.disallow;
        changed = true;
    }
    // Convert v3 string 'dependencies' properties to arrays
    if (typeof newSchema.dependencies === 'object' &&
        Object.keys(newSchema.dependencies)
            .some(function (key) { return typeof newSchema.dependencies[key] === 'string'; })) {
        newSchema.dependencies = tslib_1.__assign({}, newSchema.dependencies);
        Object.keys(newSchema.dependencies)
            .filter(function (key) { return typeof newSchema.dependencies[key] === 'string'; })
            .forEach(function (key) { return newSchema.dependencies[key] = [newSchema.dependencies[key]]; });
        changed = true;
    }
    // Convert v1 'maxDecimal' to 'multipleOf'
    if (typeof newSchema.maxDecimal === 'number') {
        newSchema.multipleOf = 1 / Math.pow(10, newSchema.maxDecimal);
        delete newSchema.divisibleBy;
        changed = true;
        if (!draft || draft === 2) {
            draft = 1;
        }
    }
    // Convert v2-v3 'divisibleBy' to 'multipleOf'
    if (typeof newSchema.divisibleBy === 'number') {
        newSchema.multipleOf = newSchema.divisibleBy;
        delete newSchema.divisibleBy;
        changed = true;
    }
    // Convert v1-v2 boolean 'minimumCanEqual' to 'exclusiveMinimum'
    if (typeof newSchema.minimum === 'number' && newSchema.minimumCanEqual === false) {
        newSchema.exclusiveMinimum = newSchema.minimum;
        delete newSchema.minimum;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    else if (typeof newSchema.minimumCanEqual === 'boolean') {
        delete newSchema.minimumCanEqual;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    // Convert v3-v4 boolean 'exclusiveMinimum' to numeric
    if (typeof newSchema.minimum === 'number' && newSchema.exclusiveMinimum === true) {
        newSchema.exclusiveMinimum = newSchema.minimum;
        delete newSchema.minimum;
        changed = true;
    }
    else if (typeof newSchema.exclusiveMinimum === 'boolean') {
        delete newSchema.exclusiveMinimum;
        changed = true;
    }
    // Convert v1-v2 boolean 'maximumCanEqual' to 'exclusiveMaximum'
    if (typeof newSchema.maximum === 'number' && newSchema.maximumCanEqual === false) {
        newSchema.exclusiveMaximum = newSchema.maximum;
        delete newSchema.maximum;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    else if (typeof newSchema.maximumCanEqual === 'boolean') {
        delete newSchema.maximumCanEqual;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    // Convert v3-v4 boolean 'exclusiveMaximum' to numeric
    if (typeof newSchema.maximum === 'number' && newSchema.exclusiveMaximum === true) {
        newSchema.exclusiveMaximum = newSchema.maximum;
        delete newSchema.maximum;
        changed = true;
    }
    else if (typeof newSchema.exclusiveMaximum === 'boolean') {
        delete newSchema.exclusiveMaximum;
        changed = true;
    }
    // Search object 'properties' for 'optional', 'required', and 'requires' items,
    // and convert them into object 'required' arrays and 'dependencies' objects
    if (typeof newSchema.properties === 'object') {
        var properties_1 = tslib_1.__assign({}, newSchema.properties);
        var requiredKeys_1 = Array.isArray(newSchema.required) ?
            new Set(newSchema.required) : new Set();
        // Convert v1-v2 boolean 'optional' properties to 'required' array
        if (draft === 1 || draft === 2 ||
            Object.keys(properties_1).some(function (key) { return properties_1[key].optional === true; })) {
            Object.keys(properties_1)
                .filter(function (key) { return properties_1[key].optional !== true; })
                .forEach(function (key) { return requiredKeys_1.add(key); });
            changed = true;
            if (!draft) {
                draft = 2;
            }
        }
        // Convert v3 boolean 'required' properties to 'required' array
        if (Object.keys(properties_1).some(function (key) { return properties_1[key].required === true; })) {
            Object.keys(properties_1)
                .filter(function (key) { return properties_1[key].required === true; })
                .forEach(function (key) { return requiredKeys_1.add(key); });
            changed = true;
        }
        if (requiredKeys_1.size) {
            newSchema.required = Array.from(requiredKeys_1);
        }
        // Convert v1-v2 array or string 'requires' properties to 'dependencies' object
        if (Object.keys(properties_1).some(function (key) { return properties_1[key].requires; })) {
            var dependencies_1 = typeof newSchema.dependencies === 'object' ? tslib_1.__assign({}, newSchema.dependencies) : {};
            Object.keys(properties_1)
                .filter(function (key) { return properties_1[key].requires; })
                .forEach(function (key) { return dependencies_1[key] =
                typeof properties_1[key].requires === 'string' ?
                    [properties_1[key].requires] : properties_1[key].requires; });
            newSchema.dependencies = dependencies_1;
            changed = true;
            if (!draft) {
                draft = 2;
            }
        }
        newSchema.properties = properties_1;
    }
    // Revove v1-v2 boolean 'optional' key
    if (typeof newSchema.optional === 'boolean') {
        delete newSchema.optional;
        changed = true;
        if (!draft) {
            draft = 2;
        }
    }
    // Revove v1-v2 'requires' key
    if (newSchema.requires) {
        delete newSchema.requires;
    }
    // Revove v3 boolean 'required' key
    if (typeof newSchema.required === 'boolean') {
        delete newSchema.required;
    }
    // Convert id to $id
    if (typeof newSchema.id === 'string' && !newSchema.$id) {
        if (newSchema.id.slice(-1) === '#') {
            newSchema.id = newSchema.id.slice(0, -1);
        }
        newSchema.$id = newSchema.id + '-CONVERTED-TO-DRAFT-06#';
        delete newSchema.id;
        changed = true;
    }
    // Check if v1-v3 'any' or object types will be converted
    if (newSchema.type && (typeof newSchema.type.every === 'function' ?
        !newSchema.type.every(function (type) { return simpleTypes.includes(type); }) :
        !simpleTypes.includes(newSchema.type))) {
        changed = true;
    }
    // If schema changed, update or remove $schema identifier
    if (typeof newSchema.$schema === 'string' &&
        /http\:\/\/json\-schema\.org\/draft\-0[1-4]\/schema\#/.test(newSchema.$schema)) {
        newSchema.$schema = 'http://json-schema.org/draft-06/schema#';
        changed = true;
    }
    else if (changed && typeof newSchema.$schema === 'string') {
        var addToDescription = 'Converted to draft 6 from ' + newSchema.$schema;
        if (typeof newSchema.description === 'string' && newSchema.description.length) {
            newSchema.description += '\n' + addToDescription;
        }
        else {
            newSchema.description = addToDescription;
        }
        delete newSchema.$schema;
    }
    // Convert v1-v3 'any' and object types
    if (newSchema.type && (typeof newSchema.type.every === 'function' ?
        !newSchema.type.every(function (type) { return simpleTypes.includes(type); }) :
        !simpleTypes.includes(newSchema.type))) {
        if (newSchema.type.length === 1) {
            newSchema.type = newSchema.type[0];
        }
        if (typeof newSchema.type === 'string') {
            // Convert string 'any' type to array of all standard types
            if (newSchema.type === 'any') {
                newSchema.type = simpleTypes;
                // Delete non-standard string type
            }
            else {
                delete newSchema.type;
            }
        }
        else if (typeof newSchema.type === 'object') {
            if (typeof newSchema.type.every === 'function') {
                // If array of strings, only allow standard types
                if (newSchema.type.every(function (type) { return typeof type === 'string'; })) {
                    newSchema.type = newSchema.type.some(function (type) { return type === 'any'; }) ?
                        newSchema.type = simpleTypes :
                        newSchema.type.filter(function (type) { return simpleTypes.includes(type); });
                    // If type is an array with objects, convert the current schema to an 'anyOf' array
                }
                else if (newSchema.type.length > 1) {
                    var arrayKeys = ['additionalItems', 'items', 'maxItems', 'minItems', 'uniqueItems', 'contains'];
                    var numberKeys = ['multipleOf', 'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum'];
                    var objectKeys = ['maxProperties', 'minProperties', 'required', 'additionalProperties',
                        'properties', 'patternProperties', 'dependencies', 'propertyNames', 'customError'];
                    var stringKeys = ['maxLength', 'minLength', 'pattern', 'format'];
                    var filterKeys_1 = {
                        'array': tslib_1.__spread(numberKeys, objectKeys, stringKeys),
                        'integer': tslib_1.__spread(arrayKeys, objectKeys, stringKeys),
                        'number': tslib_1.__spread(arrayKeys, objectKeys, stringKeys),
                        'object': tslib_1.__spread(arrayKeys, numberKeys, stringKeys),
                        'string': tslib_1.__spread(arrayKeys, numberKeys, objectKeys),
                        'all': tslib_1.__spread(arrayKeys, numberKeys, objectKeys, stringKeys),
                    };
                    var anyOf = [];
                    var _loop_1 = function (type) {
                        var newType = typeof type === 'string' ? { type: type } : tslib_1.__assign({}, type);
                        Object.keys(newSchema)
                            .filter(function (key) { return !newType.hasOwnProperty(key) &&
                            !tslib_1.__spread((filterKeys_1[newType.type] || filterKeys_1.all), ['type', 'default']).includes(key); })
                            .forEach(function (key) { return newType[key] = newSchema[key]; });
                        anyOf.push(newType);
                    };
                    try {
                        for (var _b = tslib_1.__values(newSchema.type), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var type = _c.value;
                            _loop_1(type);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    newSchema = newSchema.hasOwnProperty('default') ?
                        { anyOf: anyOf, default: newSchema.default } : { anyOf: anyOf };
                    // If type is an object, merge it with the current schema
                }
                else {
                    var typeSchema = newSchema.type;
                    delete newSchema.type;
                    Object.assign(newSchema, typeSchema);
                }
            }
        }
        else {
            delete newSchema.type;
        }
    }
    // Convert sub schemas
    Object.keys(newSchema)
        .filter(function (key) { return typeof newSchema[key] === 'object'; })
        .forEach(function (key) {
        if (['definitions', 'dependencies', 'properties', 'patternProperties']
            .includes(key) && typeof newSchema[key].map !== 'function') {
            var newKey_1 = {};
            Object.keys(newSchema[key]).forEach(function (subKey) { return newKey_1[subKey] =
                convertSchemaToDraft6(newSchema[key][subKey], { changed: changed, draft: draft }); });
            newSchema[key] = newKey_1;
        }
        else if (['items', 'additionalItems', 'additionalProperties',
            'allOf', 'anyOf', 'oneOf', 'not'].includes(key)) {
            newSchema[key] = convertSchemaToDraft6(newSchema[key], { changed: changed, draft: draft });
        }
        else {
            newSchema[key] = _.cloneDeep(newSchema[key]);
        }
    });
    return newSchema;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udmVydC1zY2hlbWEtdG8tZHJhZnQ2LmZ1bmN0aW9uLmpzIiwic291cmNlUm9vdCI6Im5nOi8vYW5ndWxhcjYtanNvbi1zY2hlbWEtZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9zaGFyZWQvY29udmVydC1zY2hlbWEtdG8tZHJhZnQ2LmZ1bmN0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLENBQUMsTUFBTSxRQUFRLENBQUM7QUFtQnZCLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsT0FBMEI7SUFBMUIsd0JBQUEsRUFBQSxZQUEwQjs7SUFDdEUsSUFBSSxLQUFLLEdBQVcsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUM7SUFDMUMsSUFBSSxPQUFPLEdBQVksT0FBTyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUM7SUFFaEQsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7UUFBRSxPQUFPLE1BQU0sQ0FBQztLQUFFO0lBQ2xELElBQUksT0FBTyxNQUFNLENBQUMsR0FBRyxLQUFLLFVBQVUsRUFBRTtRQUNwQyx3QkFBVyxNQUFNLENBQUMsR0FBRyxDQUFDLFVBQUEsU0FBUyxJQUFJLE9BQUEscUJBQXFCLENBQUMsU0FBUyxFQUFFLEVBQUUsT0FBTyxTQUFBLEVBQUUsS0FBSyxPQUFBLEVBQUUsQ0FBQyxFQUFwRCxDQUFvRCxDQUFDLEVBQUU7S0FDM0Y7SUFDRCxJQUFJLFNBQVMsd0JBQVEsTUFBTSxDQUFFLENBQUM7SUFDOUIsSUFBTSxXQUFXLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUUxRixJQUFJLE9BQU8sU0FBUyxDQUFDLE9BQU8sS0FBSyxRQUFRO1FBQ3ZDLG1EQUFtRCxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQzNFO1FBQ0EsS0FBSyxHQUFHLFNBQVMsQ0FBQyxP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cUJBQXFCLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxTQUFBLEVBQUUsS0FBSyxPQUFBLEVBQUUsQ0FBQyxDQUFDO1NBQzVFO2FBQU07WUFDTCxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUM5QztJQUNILENBQUMsQ0FBQyxDQUFDO0lBRUwsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5cbi8qKlxuICogJ2NvbnZlcnRTY2hlbWFUb0RyYWZ0NicgZnVuY3Rpb25cbiAqXG4gKiBDb252ZXJ0cyBhIEpTT04gU2NoZW1hIGZyb20gZHJhZnQgMSB0aHJvdWdoIDQgZm9ybWF0IHRvIGRyYWZ0IDYgZm9ybWF0XG4gKlxuICogSW5zcGlyZWQgYnkgb24gZ2VyYWludGx1ZmYncyBKU09OIFNjaGVtYSAzIHRvIDQgY29tcGF0aWJpbGl0eSBmdW5jdGlvbjpcbiAqICAgaHR0cHM6Ly9naXRodWIuY29tL2dlcmFpbnRsdWZmL2pzb24tc2NoZW1hLWNvbXBhdGliaWxpdHlcbiAqIEFsc28gdXNlcyBzdWdnZXN0aW9ucyBmcm9tIEFKVidzIEpTT04gU2NoZW1hIDQgdG8gNiBtaWdyYXRpb24gZ3VpZGU6XG4gKiAgIGh0dHBzOi8vZ2l0aHViLmNvbS9lcG9iZXJlemtpbi9hanYvcmVsZWFzZXMvdGFnLzUuMC4wXG4gKiBBbmQgYWRkaXRpb25hbCBkZXRhaWxzIGZyb20gdGhlIG9mZmljaWFsIEpTT04gU2NoZW1hIGRvY3VtZW50YXRpb246XG4gKiAgIGh0dHA6Ly9qc29uLXNjaGVtYS5vcmdcbiAqXG4gKiAvLyAgeyBvYmplY3QgfSBvcmlnaW5hbFNjaGVtYSAtIEpTT04gc2NoZW1hIChkcmFmdCAxLCAyLCAzLCA0LCBvciA2KVxuICogLy8gIHsgT3B0aW9uT2JqZWN0ID0ge30gfSBvcHRpb25zIC0gb3B0aW9uczogcGFyZW50IHNjaGVtYSBjaGFuZ2VkPywgc2NoZW1hIGRyYWZ0IG51bWJlcj9cbiAqIC8vIHsgb2JqZWN0IH0gLSBKU09OIHNjaGVtYSAoZHJhZnQgNilcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPcHRpb25PYmplY3QgeyBjaGFuZ2VkPzogYm9vbGVhbjsgZHJhZnQ/OiBudW1iZXI7IH1cbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0U2NoZW1hVG9EcmFmdDYoc2NoZW1hLCBvcHRpb25zOiBPcHRpb25PYmplY3QgPSB7fSkge1xuICBsZXQgZHJhZnQ6IG51bWJlciA9IG9wdGlvbnMuZHJhZnQgfHwgbnVsbDtcbiAgbGV0IGNoYW5nZWQ6IGJvb2xlYW4gPSBvcHRpb25zLmNoYW5nZWQgfHwgZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBzY2hlbWEgIT09ICdvYmplY3QnKSB7IHJldHVybiBzY2hlbWE7IH1cbiAgaWYgKHR5cGVvZiBzY2hlbWEubWFwID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIFsuLi5zY2hlbWEubWFwKHN1YlNjaGVtYSA9PiBjb252ZXJ0U2NoZW1hVG9EcmFmdDYoc3ViU2NoZW1hLCB7IGNoYW5nZWQsIGRyYWZ0IH0pKV07XG4gIH1cbiAgbGV0IG5ld1NjaGVtYSA9IHsgLi4uc2NoZW1hIH07XG4gIGNvbnN0IHNpbXBsZVR5cGVzID0gWydhcnJheScsICdib29sZWFuJywgJ2ludGVnZXInLCAnbnVsbCcsICdudW1iZXInLCAnb2JqZWN0JywgJ3N0cmluZyddO1xuXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLiRzY2hlbWEgPT09ICdzdHJpbmcnICYmXG4gICAgL2h0dHBcXDpcXC9cXC9qc29uXFwtc2NoZW1hXFwub3JnXFwvZHJhZnRcXC0wXFxkXFwvc2NoZW1hXFwjLy50ZXN0KG5ld1NjaGVtYS4kc2NoZW1hKVxuICApIHtcbiAgICBkcmFmdCA9IG5ld1NjaGVtYS4kc2NoZW1hWzMwXTtcbiAgfVxuXG4gIC8vIENvbnZlcnQgdjEtdjIgJ2NvbnRlbnRFbmNvZGluZycgdG8gJ21lZGlhLmJpbmFyeUVuY29kaW5nJ1xuICAvLyBOb3RlOiBUaGlzIGlzIG9ubHkgdXNlZCBpbiBKU09OIGh5cGVyLXNjaGVtYSAobm90IHJlZ3VsYXIgSlNPTiBzY2hlbWEpXG4gIGlmIChuZXdTY2hlbWEuY29udGVudEVuY29kaW5nKSB7XG4gICAgbmV3U2NoZW1hLm1lZGlhID0geyBiaW5hcnlFbmNvZGluZzogbmV3U2NoZW1hLmNvbnRlbnRFbmNvZGluZyB9O1xuICAgIGRlbGV0ZSBuZXdTY2hlbWEuY29udGVudEVuY29kaW5nO1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ29udmVydCB2MS12MyAnZXh0ZW5kcycgdG8gJ2FsbE9mJ1xuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5leHRlbmRzID09PSAnb2JqZWN0Jykge1xuICAgIG5ld1NjaGVtYS5hbGxPZiA9IHR5cGVvZiBuZXdTY2hlbWEuZXh0ZW5kcy5tYXAgPT09ICdmdW5jdGlvbicgP1xuICAgICAgbmV3U2NoZW1hLmV4dGVuZHMubWFwKHN1YlNjaGVtYSA9PiBjb252ZXJ0U2NoZW1hVG9EcmFmdDYoc3ViU2NoZW1hLCB7IGNoYW5nZWQsIGRyYWZ0IH0pKSA6XG4gICAgICBbY29udmVydFNjaGVtYVRvRHJhZnQ2KG5ld1NjaGVtYS5leHRlbmRzLCB7IGNoYW5nZWQsIGRyYWZ0IH0pXTtcbiAgICBkZWxldGUgbmV3U2NoZW1hLmV4dGVuZHM7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvLyBDb252ZXJ0IHYxLXYzICdkaXNhbGxvdycgdG8gJ25vdCdcbiAgaWYgKG5ld1NjaGVtYS5kaXNhbGxvdykge1xuICAgIGlmICh0eXBlb2YgbmV3U2NoZW1hLmRpc2FsbG93ID09PSAnc3RyaW5nJykge1xuICAgICAgbmV3U2NoZW1hLm5vdCA9IHsgdHlwZTogbmV3U2NoZW1hLmRpc2FsbG93IH07XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbmV3U2NoZW1hLmRpc2FsbG93Lm1hcCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgbmV3U2NoZW1hLm5vdCA9IHtcbiAgICAgICAgYW55T2Y6IG5ld1NjaGVtYS5kaXNhbGxvd1xuICAgICAgICAgIC5tYXAodHlwZSA9PiB0eXBlb2YgdHlwZSA9PT0gJ29iamVjdCcgPyB0eXBlIDogeyB0eXBlIH0pXG4gICAgICB9O1xuICAgIH1cbiAgICBkZWxldGUgbmV3U2NoZW1hLmRpc2FsbG93O1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ29udmVydCB2MyBzdHJpbmcgJ2RlcGVuZGVuY2llcycgcHJvcGVydGllcyB0byBhcnJheXNcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEuZGVwZW5kZW5jaWVzID09PSAnb2JqZWN0JyAmJlxuICAgIE9iamVjdC5rZXlzKG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMpXG4gICAgICAuc29tZShrZXkgPT4gdHlwZW9mIG5ld1NjaGVtYS5kZXBlbmRlbmNpZXNba2V5XSA9PT0gJ3N0cmluZycpXG4gICkge1xuICAgIG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgPSB7IC4uLm5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgfTtcbiAgICBPYmplY3Qua2V5cyhuZXdTY2hlbWEuZGVwZW5kZW5jaWVzKVxuICAgICAgLmZpbHRlcihrZXkgPT4gdHlwZW9mIG5ld1NjaGVtYS5kZXBlbmRlbmNpZXNba2V5XSA9PT0gJ3N0cmluZycpXG4gICAgICAuZm9yRWFjaChrZXkgPT4gbmV3U2NoZW1hLmRlcGVuZGVuY2llc1trZXldID0gW25ld1NjaGVtYS5kZXBlbmRlbmNpZXNba2V5XV0pO1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ29udmVydCB2MSAnbWF4RGVjaW1hbCcgdG8gJ211bHRpcGxlT2YnXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLm1heERlY2ltYWwgPT09ICdudW1iZXInKSB7XG4gICAgbmV3U2NoZW1hLm11bHRpcGxlT2YgPSAxIC8gTWF0aC5wb3coMTAsIG5ld1NjaGVtYS5tYXhEZWNpbWFsKTtcbiAgICBkZWxldGUgbmV3U2NoZW1hLmRpdmlzaWJsZUJ5O1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGlmICghZHJhZnQgfHwgZHJhZnQgPT09IDIpIHsgZHJhZnQgPSAxOyB9XG4gIH1cblxuICAvLyBDb252ZXJ0IHYyLXYzICdkaXZpc2libGVCeScgdG8gJ211bHRpcGxlT2YnXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLmRpdmlzaWJsZUJ5ID09PSAnbnVtYmVyJykge1xuICAgIG5ld1NjaGVtYS5tdWx0aXBsZU9mID0gbmV3U2NoZW1hLmRpdmlzaWJsZUJ5O1xuICAgIGRlbGV0ZSBuZXdTY2hlbWEuZGl2aXNpYmxlQnk7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gIH1cblxuICAvLyBDb252ZXJ0IHYxLXYyIGJvb2xlYW4gJ21pbmltdW1DYW5FcXVhbCcgdG8gJ2V4Y2x1c2l2ZU1pbmltdW0nXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLm1pbmltdW0gPT09ICdudW1iZXInICYmIG5ld1NjaGVtYS5taW5pbXVtQ2FuRXF1YWwgPT09IGZhbHNlKSB7XG4gICAgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1pbmltdW0gPSBuZXdTY2hlbWEubWluaW11bTtcbiAgICBkZWxldGUgbmV3U2NoZW1hLm1pbmltdW07XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgbmV3U2NoZW1hLm1pbmltdW1DYW5FcXVhbCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgZGVsZXRlIG5ld1NjaGVtYS5taW5pbXVtQ2FuRXF1YWw7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cbiAgfVxuXG4gIC8vIENvbnZlcnQgdjMtdjQgYm9vbGVhbiAnZXhjbHVzaXZlTWluaW11bScgdG8gbnVtZXJpY1xuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5taW5pbXVtID09PSAnbnVtYmVyJyAmJiBuZXdTY2hlbWEuZXhjbHVzaXZlTWluaW11bSA9PT0gdHJ1ZSkge1xuICAgIG5ld1NjaGVtYS5leGNsdXNpdmVNaW5pbXVtID0gbmV3U2NoZW1hLm1pbmltdW07XG4gICAgZGVsZXRlIG5ld1NjaGVtYS5taW5pbXVtO1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBuZXdTY2hlbWEuZXhjbHVzaXZlTWluaW11bSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgZGVsZXRlIG5ld1NjaGVtYS5leGNsdXNpdmVNaW5pbXVtO1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ29udmVydCB2MS12MiBib29sZWFuICdtYXhpbXVtQ2FuRXF1YWwnIHRvICdleGNsdXNpdmVNYXhpbXVtJ1xuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5tYXhpbXVtID09PSAnbnVtYmVyJyAmJiBuZXdTY2hlbWEubWF4aW11bUNhbkVxdWFsID09PSBmYWxzZSkge1xuICAgIG5ld1NjaGVtYS5leGNsdXNpdmVNYXhpbXVtID0gbmV3U2NoZW1hLm1heGltdW07XG4gICAgZGVsZXRlIG5ld1NjaGVtYS5tYXhpbXVtO1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGlmICghZHJhZnQpIHsgZHJhZnQgPSAyOyB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIG5ld1NjaGVtYS5tYXhpbXVtQ2FuRXF1YWwgPT09ICdib29sZWFuJykge1xuICAgIGRlbGV0ZSBuZXdTY2hlbWEubWF4aW11bUNhbkVxdWFsO1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGlmICghZHJhZnQpIHsgZHJhZnQgPSAyOyB9XG4gIH1cblxuICAvLyBDb252ZXJ0IHYzLXY0IGJvb2xlYW4gJ2V4Y2x1c2l2ZU1heGltdW0nIHRvIG51bWVyaWNcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEubWF4aW11bSA9PT0gJ251bWJlcicgJiYgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gPT09IHRydWUpIHtcbiAgICBuZXdTY2hlbWEuZXhjbHVzaXZlTWF4aW11bSA9IG5ld1NjaGVtYS5tYXhpbXVtO1xuICAgIGRlbGV0ZSBuZXdTY2hlbWEubWF4aW11bTtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgbmV3U2NoZW1hLmV4Y2x1c2l2ZU1heGltdW0gPT09ICdib29sZWFuJykge1xuICAgIGRlbGV0ZSBuZXdTY2hlbWEuZXhjbHVzaXZlTWF4aW11bTtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFNlYXJjaCBvYmplY3QgJ3Byb3BlcnRpZXMnIGZvciAnb3B0aW9uYWwnLCAncmVxdWlyZWQnLCBhbmQgJ3JlcXVpcmVzJyBpdGVtcyxcbiAgLy8gYW5kIGNvbnZlcnQgdGhlbSBpbnRvIG9iamVjdCAncmVxdWlyZWQnIGFycmF5cyBhbmQgJ2RlcGVuZGVuY2llcycgb2JqZWN0c1xuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5wcm9wZXJ0aWVzID09PSAnb2JqZWN0Jykge1xuICAgIGNvbnN0IHByb3BlcnRpZXMgPSB7IC4uLm5ld1NjaGVtYS5wcm9wZXJ0aWVzIH07XG4gICAgY29uc3QgcmVxdWlyZWRLZXlzID0gQXJyYXkuaXNBcnJheShuZXdTY2hlbWEucmVxdWlyZWQpID9cbiAgICAgIG5ldyBTZXQobmV3U2NoZW1hLnJlcXVpcmVkKSA6IG5ldyBTZXQoKTtcblxuICAgIC8vIENvbnZlcnQgdjEtdjIgYm9vbGVhbiAnb3B0aW9uYWwnIHByb3BlcnRpZXMgdG8gJ3JlcXVpcmVkJyBhcnJheVxuICAgIGlmIChkcmFmdCA9PT0gMSB8fCBkcmFmdCA9PT0gMiB8fFxuICAgICAgT2JqZWN0LmtleXMocHJvcGVydGllcykuc29tZShrZXkgPT4gcHJvcGVydGllc1trZXldLm9wdGlvbmFsID09PSB0cnVlKVxuICAgICkge1xuICAgICAgT2JqZWN0LmtleXMocHJvcGVydGllcylcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gcHJvcGVydGllc1trZXldLm9wdGlvbmFsICE9PSB0cnVlKVxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gcmVxdWlyZWRLZXlzLmFkZChrZXkpKTtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cbiAgICB9XG5cbiAgICAvLyBDb252ZXJ0IHYzIGJvb2xlYW4gJ3JlcXVpcmVkJyBwcm9wZXJ0aWVzIHRvICdyZXF1aXJlZCcgYXJyYXlcbiAgICBpZiAoT2JqZWN0LmtleXMocHJvcGVydGllcykuc29tZShrZXkgPT4gcHJvcGVydGllc1trZXldLnJlcXVpcmVkID09PSB0cnVlKSkge1xuICAgICAgT2JqZWN0LmtleXMocHJvcGVydGllcylcbiAgICAgICAgLmZpbHRlcihrZXkgPT4gcHJvcGVydGllc1trZXldLnJlcXVpcmVkID09PSB0cnVlKVxuICAgICAgICAuZm9yRWFjaChrZXkgPT4gcmVxdWlyZWRLZXlzLmFkZChrZXkpKTtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChyZXF1aXJlZEtleXMuc2l6ZSkgeyBuZXdTY2hlbWEucmVxdWlyZWQgPSBBcnJheS5mcm9tKHJlcXVpcmVkS2V5cyk7IH1cblxuICAgIC8vIENvbnZlcnQgdjEtdjIgYXJyYXkgb3Igc3RyaW5nICdyZXF1aXJlcycgcHJvcGVydGllcyB0byAnZGVwZW5kZW5jaWVzJyBvYmplY3RcbiAgICBpZiAoT2JqZWN0LmtleXMocHJvcGVydGllcykuc29tZShrZXkgPT4gcHJvcGVydGllc1trZXldLnJlcXVpcmVzKSkge1xuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gdHlwZW9mIG5ld1NjaGVtYS5kZXBlbmRlbmNpZXMgPT09ICdvYmplY3QnID9cbiAgICAgICAgeyAuLi5uZXdTY2hlbWEuZGVwZW5kZW5jaWVzIH0gOiB7fTtcbiAgICAgIE9iamVjdC5rZXlzKHByb3BlcnRpZXMpXG4gICAgICAgIC5maWx0ZXIoa2V5ID0+IHByb3BlcnRpZXNba2V5XS5yZXF1aXJlcylcbiAgICAgICAgLmZvckVhY2goa2V5ID0+IGRlcGVuZGVuY2llc1trZXldID1cbiAgICAgICAgICB0eXBlb2YgcHJvcGVydGllc1trZXldLnJlcXVpcmVzID09PSAnc3RyaW5nJyA/XG4gICAgICAgICAgICBbcHJvcGVydGllc1trZXldLnJlcXVpcmVzXSA6IHByb3BlcnRpZXNba2V5XS5yZXF1aXJlc1xuICAgICAgICApO1xuICAgICAgbmV3U2NoZW1hLmRlcGVuZGVuY2llcyA9IGRlcGVuZGVuY2llcztcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgaWYgKCFkcmFmdCkgeyBkcmFmdCA9IDI7IH1cbiAgICB9XG5cbiAgICBuZXdTY2hlbWEucHJvcGVydGllcyA9IHByb3BlcnRpZXM7XG4gIH1cblxuICAvLyBSZXZvdmUgdjEtdjIgYm9vbGVhbiAnb3B0aW9uYWwnIGtleVxuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5vcHRpb25hbCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgZGVsZXRlIG5ld1NjaGVtYS5vcHRpb25hbDtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBpZiAoIWRyYWZ0KSB7IGRyYWZ0ID0gMjsgfVxuICB9XG5cbiAgLy8gUmV2b3ZlIHYxLXYyICdyZXF1aXJlcycga2V5XG4gIGlmIChuZXdTY2hlbWEucmVxdWlyZXMpIHtcbiAgICBkZWxldGUgbmV3U2NoZW1hLnJlcXVpcmVzO1xuICB9XG5cbiAgLy8gUmV2b3ZlIHYzIGJvb2xlYW4gJ3JlcXVpcmVkJyBrZXlcbiAgaWYgKHR5cGVvZiBuZXdTY2hlbWEucmVxdWlyZWQgPT09ICdib29sZWFuJykge1xuICAgIGRlbGV0ZSBuZXdTY2hlbWEucmVxdWlyZWQ7XG4gIH1cblxuICAvLyBDb252ZXJ0IGlkIHRvICRpZFxuICBpZiAodHlwZW9mIG5ld1NjaGVtYS5pZCA9PT0gJ3N0cmluZycgJiYgIW5ld1NjaGVtYS4kaWQpIHtcbiAgICBpZiAobmV3U2NoZW1hLmlkLnNsaWNlKC0xKSA9PT0gJyMnKSB7XG4gICAgICBuZXdTY2hlbWEuaWQgPSBuZXdTY2hlbWEuaWQuc2xpY2UoMCwgLTEpO1xuICAgIH1cbiAgICBuZXdTY2hlbWEuJGlkID0gbmV3U2NoZW1hLmlkICsgJy1DT05WRVJURUQtVE8tRFJBRlQtMDYjJztcbiAgICBkZWxldGUgbmV3U2NoZW1hLmlkO1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gQ2hlY2sgaWYgdjEtdjMgJ2FueScgb3Igb2JqZWN0IHR5cGVzIHdpbGwgYmUgY29udmVydGVkXG4gIGlmIChuZXdTY2hlbWEudHlwZSAmJiAodHlwZW9mIG5ld1NjaGVtYS50eXBlLmV2ZXJ5ID09PSAnZnVuY3Rpb24nID9cbiAgICAhbmV3U2NoZW1hLnR5cGUuZXZlcnkodHlwZSA9PiBzaW1wbGVUeXBlcy5pbmNsdWRlcyh0eXBlKSkgOlxuICAgICFzaW1wbGVUeXBlcy5pbmNsdWRlcyhuZXdTY2hlbWEudHlwZSlcbiAgKSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICB9XG5cbiAgLy8gSWYgc2NoZW1hIGNoYW5nZWQsIHVwZGF0ZSBvciByZW1vdmUgJHNjaGVtYSBpZGVudGlmaWVyXG4gIGlmICh0eXBlb2YgbmV3U2NoZW1hLiRzY2hlbWEgPT09ICdzdHJpbmcnICYmXG4gICAgL2h0dHBcXDpcXC9cXC9qc29uXFwtc2NoZW1hXFwub3JnXFwvZHJhZnRcXC0wWzEtNF1cXC9zY2hlbWFcXCMvLnRlc3QobmV3U2NoZW1hLiRzY2hlbWEpXG4gICkge1xuICAgIG5ld1NjaGVtYS4kc2NoZW1hID0gJ2h0dHA6Ly9qc29uLXNjaGVtYS5vcmcvZHJhZnQtMDYvc2NoZW1hIyc7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gIH0gZWxzZSBpZiAoY2hhbmdlZCAmJiB0eXBlb2YgbmV3U2NoZW1hLiRzY2hlbWEgPT09ICdzdHJpbmcnKSB7XG4gICAgY29uc3QgYWRkVG9EZXNjcmlwdGlvbiA9ICdDb252ZXJ0ZWQgdG8gZHJhZnQgNiBmcm9tICcgKyBuZXdTY2hlbWEuJHNjaGVtYTtcbiAgICBpZiAodHlwZW9mIG5ld1NjaGVtYS5kZXNjcmlwdGlvbiA9PT0gJ3N0cmluZycgJiYgbmV3U2NoZW1hLmRlc2NyaXB0aW9uLmxlbmd0aCkge1xuICAgICAgbmV3U2NoZW1hLmRlc2NyaXB0aW9uICs9ICdcXG4nICsgYWRkVG9EZXNjcmlwdGlvbjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3U2NoZW1hLmRlc2NyaXB0aW9uID0gYWRkVG9EZXNjcmlwdGlvbjtcbiAgICB9XG4gICAgZGVsZXRlIG5ld1NjaGVtYS4kc2NoZW1hO1xuICB9XG5cbiAgLy8gQ29udmVydCB2MS12MyAnYW55JyBhbmQgb2JqZWN0IHR5cGVzXG4gIGlmIChuZXdTY2hlbWEudHlwZSAmJiAodHlwZW9mIG5ld1NjaGVtYS50eXBlLmV2ZXJ5ID09PSAnZnVuY3Rpb24nID9cbiAgICAhbmV3U2NoZW1hLnR5cGUuZXZlcnkodHlwZSA9PiBzaW1wbGVUeXBlcy5pbmNsdWRlcyh0eXBlKSkgOlxuICAgICFzaW1wbGVUeXBlcy5pbmNsdWRlcyhuZXdTY2hlbWEudHlwZSlcbiAgKSkge1xuICAgIGlmIChuZXdTY2hlbWEudHlwZS5sZW5ndGggPT09IDEpIHsgbmV3U2NoZW1hLnR5cGUgPSBuZXdTY2hlbWEudHlwZVswXTsgfVxuICAgIGlmICh0eXBlb2YgbmV3U2NoZW1hLnR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBDb252ZXJ0IHN0cmluZyAnYW55JyB0eXBlIHRvIGFycmF5IG9mIGFsbCBzdGFuZGFyZCB0eXBlc1xuICAgICAgaWYgKG5ld1NjaGVtYS50eXBlID09PSAnYW55Jykge1xuICAgICAgICBuZXdTY2hlbWEudHlwZSA9IHNpbXBsZVR5cGVzO1xuICAgICAgICAvLyBEZWxldGUgbm9uLXN0YW5kYXJkIHN0cmluZyB0eXBlXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWxldGUgbmV3U2NoZW1hLnR5cGU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbmV3U2NoZW1hLnR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgICBpZiAodHlwZW9mIG5ld1NjaGVtYS50eXBlLmV2ZXJ5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIElmIGFycmF5IG9mIHN0cmluZ3MsIG9ubHkgYWxsb3cgc3RhbmRhcmQgdHlwZXNcbiAgICAgICAgaWYgKG5ld1NjaGVtYS50eXBlLmV2ZXJ5KHR5cGUgPT4gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnKSkge1xuICAgICAgICAgIG5ld1NjaGVtYS50eXBlID0gbmV3U2NoZW1hLnR5cGUuc29tZSh0eXBlID0+IHR5cGUgPT09ICdhbnknKSA/XG4gICAgICAgICAgICBuZXdTY2hlbWEudHlwZSA9IHNpbXBsZVR5cGVzIDpcbiAgICAgICAgICAgIG5ld1NjaGVtYS50eXBlLmZpbHRlcih0eXBlID0+IHNpbXBsZVR5cGVzLmluY2x1ZGVzKHR5cGUpKTtcbiAgICAgICAgICAvLyBJZiB0eXBlIGlzIGFuIGFycmF5IHdpdGggb2JqZWN0cywgY29udmVydCB0aGUgY3VycmVudCBzY2hlbWEgdG8gYW4gJ2FueU9mJyBhcnJheVxuICAgICAgICB9IGVsc2UgaWYgKG5ld1NjaGVtYS50eXBlLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICBjb25zdCBhcnJheUtleXMgPSBbJ2FkZGl0aW9uYWxJdGVtcycsICdpdGVtcycsICdtYXhJdGVtcycsICdtaW5JdGVtcycsICd1bmlxdWVJdGVtcycsICdjb250YWlucyddO1xuICAgICAgICAgIGNvbnN0IG51bWJlcktleXMgPSBbJ211bHRpcGxlT2YnLCAnbWF4aW11bScsICdleGNsdXNpdmVNYXhpbXVtJywgJ21pbmltdW0nLCAnZXhjbHVzaXZlTWluaW11bSddO1xuICAgICAgICAgIGNvbnN0IG9iamVjdEtleXMgPSBbJ21heFByb3BlcnRpZXMnLCAnbWluUHJvcGVydGllcycsICdyZXF1aXJlZCcsICdhZGRpdGlvbmFsUHJvcGVydGllcycsXG4gICAgICAgICAgICAncHJvcGVydGllcycsICdwYXR0ZXJuUHJvcGVydGllcycsICdkZXBlbmRlbmNpZXMnLCAncHJvcGVydHlOYW1lcyddO1xuICAgICAgICAgIGNvbnN0IHN0cmluZ0tleXMgPSBbJ21heExlbmd0aCcsICdtaW5MZW5ndGgnLCAncGF0dGVybicsICdmb3JtYXQnXTtcbiAgICAgICAgICBjb25zdCBmaWx0ZXJLZXlzID0ge1xuICAgICAgICAgICAgJ2FycmF5JzogWy4uLm51bWJlcktleXMsIC4uLm9iamVjdEtleXMsIC4uLnN0cmluZ0tleXNdLFxuICAgICAgICAgICAgJ2ludGVnZXInOiBbLi4uYXJyYXlLZXlzLCAuLi5vYmplY3RLZXlzLCAuLi5zdHJpbmdLZXlzXSxcbiAgICAgICAgICAgICdudW1iZXInOiBbLi4uYXJyYXlLZXlzLCAuLi5vYmplY3RLZXlzLCAuLi5zdHJpbmdLZXlzXSxcbiAgICAgICAgICAgICdvYmplY3QnOiBbLi4uYXJyYXlLZXlzLCAuLi5udW1iZXJLZXlzLCAuLi5zdHJpbmdLZXlzXSxcbiAgICAgICAgICAgICdzdHJpbmcnOiBbLi4uYXJyYXlLZXlzLCAuLi5udW1iZXJLZXlzLCAuLi5vYmplY3RLZXlzXSxcbiAgICAgICAgICAgICdhbGwnOiBbLi4uYXJyYXlLZXlzLCAuLi5udW1iZXJLZXlzLCAuLi5vYmplY3RLZXlzLCAuLi5zdHJpbmdLZXlzXSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIGNvbnN0IGFueU9mID0gW107XG4gICAgICAgICAgZm9yIChjb25zdCB0eXBlIG9mIG5ld1NjaGVtYS50eXBlKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdUeXBlID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8geyB0eXBlIH0gOiB7IC4uLnR5cGUgfTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG5ld1NjaGVtYSlcbiAgICAgICAgICAgICAgLmZpbHRlcihrZXkgPT4gIW5ld1R5cGUuaGFzT3duUHJvcGVydHkoa2V5KSAmJlxuICAgICAgICAgICAgICAgICFbLi4uKGZpbHRlcktleXNbbmV3VHlwZS50eXBlXSB8fCBmaWx0ZXJLZXlzLmFsbCksICd0eXBlJywgJ2RlZmF1bHQnXVxuICAgICAgICAgICAgICAgICAgLmluY2x1ZGVzKGtleSlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAuZm9yRWFjaChrZXkgPT4gbmV3VHlwZVtrZXldID0gbmV3U2NoZW1hW2tleV0pO1xuICAgICAgICAgICAgYW55T2YucHVzaChuZXdUeXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV3U2NoZW1hID0gbmV3U2NoZW1hLmhhc093blByb3BlcnR5KCdkZWZhdWx0JykgP1xuICAgICAgICAgICAgeyBhbnlPZiwgZGVmYXVsdDogbmV3U2NoZW1hLmRlZmF1bHQgfSA6IHsgYW55T2YgfTtcbiAgICAgICAgICAvLyBJZiB0eXBlIGlzIGFuIG9iamVjdCwgbWVyZ2UgaXQgd2l0aCB0aGUgY3VycmVudCBzY2hlbWFcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zdCB0eXBlU2NoZW1hID0gbmV3U2NoZW1hLnR5cGU7XG4gICAgICAgICAgZGVsZXRlIG5ld1NjaGVtYS50eXBlO1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24obmV3U2NoZW1hLCB0eXBlU2NoZW1hKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgbmV3U2NoZW1hLnR5cGU7XG4gICAgfVxuICB9XG5cbiAgLy8gQ29udmVydCBzdWIgc2NoZW1hc1xuICBPYmplY3Qua2V5cyhuZXdTY2hlbWEpXG4gICAgLmZpbHRlcihrZXkgPT4gdHlwZW9mIG5ld1NjaGVtYVtrZXldID09PSAnb2JqZWN0JylcbiAgICAuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKFxuICAgICAgICBbJ2RlZmluaXRpb25zJywgJ2RlcGVuZGVuY2llcycsICdwcm9wZXJ0aWVzJywgJ3BhdHRlcm5Qcm9wZXJ0aWVzJ11cbiAgICAgICAgICAuaW5jbHVkZXMoa2V5KSAmJiB0eXBlb2YgbmV3U2NoZW1hW2tleV0ubWFwICE9PSAnZnVuY3Rpb24nXG4gICAgICApIHtcbiAgICAgICAgY29uc3QgbmV3S2V5ID0ge307XG4gICAgICAgIE9iamVjdC5rZXlzKG5ld1NjaGVtYVtrZXldKS5mb3JFYWNoKHN1YktleSA9PiBuZXdLZXlbc3ViS2V5XSA9XG4gICAgICAgICAgY29udmVydFNjaGVtYVRvRHJhZnQ2KG5ld1NjaGVtYVtrZXldW3N1YktleV0sIHsgY2hhbmdlZCwgZHJhZnQgfSlcbiAgICAgICAgKTtcbiAgICAgICAgbmV3U2NoZW1hW2tleV0gPSBuZXdLZXk7XG4gICAgICB9IGVsc2UgaWYgKFxuICAgICAgICBbJ2l0ZW1zJywgJ2FkZGl0aW9uYWxJdGVtcycsICdhZGRpdGlvbmFsUHJvcGVydGllcycsXG4gICAgICAgICAgJ2FsbE9mJywgJ2FueU9mJywgJ29uZU9mJywgJ25vdCddLmluY2x1ZGVzKGtleSlcbiAgICAgICkge1xuICAgICAgICBuZXdTY2hlbWFba2V5XSA9IGNvbnZlcnRTY2hlbWFUb0RyYWZ0NihuZXdTY2hlbWFba2V5XSwgeyBjaGFuZ2VkLCBkcmFmdCB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld1NjaGVtYVtrZXldID0gXy5jbG9uZURlZXAobmV3U2NoZW1hW2tleV0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIHJldHVybiBuZXdTY2hlbWE7XG59XG4iXX0=