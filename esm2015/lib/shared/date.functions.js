/**
 * 'dateToString' function
 *
 * //  { Date | string } date
 * //   options
 * // { string }
 */
export function dateToString(date, options = {}) {
    const dateFormat = options.dateFormat || 'YYYY-MM-DD';
    // TODO: Use options.locale to change default format and names
    // const locale = options.locale || 'en-US';
    if (typeof date === 'string') {
        date = stringToDate(date);
    }
    if (Object.prototype.toString.call(date) !== '[object Date]') {
        return null;
    }
    const longMonths = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dateFormat
        .replace(/YYYY/ig, date.getFullYear() + '')
        .replace(/YY/ig, (date.getFullYear() + '').slice(-2))
        .replace(/MMMM/ig, longMonths[date.getMonth()])
        .replace(/MMM/ig, shortMonths[date.getMonth()])
        .replace(/MM/ig, ('0' + (date.getMonth() + 1)).slice(-2))
        .replace(/M/ig, (date.getMonth() + 1) + '')
        .replace(/DDDD/ig, longDays[date.getDay()])
        .replace(/DDD/ig, shortDays[date.getDay()])
        .replace(/DD/ig, ('0' + date.getDate()).slice(-2))
        .replace(/D/ig, date.getDate() + '')
        .replace(/S/ig, ordinal(date.getDate()));
}
export function ordinal(number) {
    if (typeof number === 'number') {
        number = number + '';
    }
    const last = number.slice(-1);
    const nextToLast = number.slice(-2, 1);
    return (nextToLast !== '1' && { '1': 'st', '2': 'nd', '3': 'rd' }[last]) || 'th';
}
/**
 * 'stringToDate' function
 *
 * //  { string } dateString
 * // { Date }
 */
export function stringToDate(dateString) {
    const getDate = findDate(dateString);
    if (!getDate) {
        return null;
    }
    let dateParts = [];
    // Split x-y-z to [x, y, z]
    if (/^\d+[^\d]\d+[^\d]\d+$/.test(getDate)) {
        dateParts = getDate.split(/[^\d]/).map(part => +part);
        // Split xxxxyyzz to [xxxx, yy, zz]
    }
    else if (/^\d{8}$/.test(getDate)) {
        dateParts = [+getDate.slice(0, 4), +getDate.slice(4, 6), +getDate.slice(6)];
    }
    const thisYear = +(new Date().getFullYear() + '').slice(-2);
    // Check for [YYYY, MM, DD]
    if (dateParts[0] > 1000 && dateParts[0] < 2100 && dateParts[1] <= 12 && dateParts[2] <= 31) {
        return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        // Check for [MM, DD, YYYY]
    }
    else if (dateParts[0] <= 12 && dateParts[1] <= 31 && dateParts[2] > 1000 && dateParts[2] < 2100) {
        return new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
        // Check for [MM, DD, YY]
    }
    else if (dateParts[0] <= 12 && dateParts[1] <= 31 && dateParts[2] < 100) {
        const year = (dateParts[2] <= thisYear ? 2000 : 1900) + dateParts[2];
        return new Date(year, dateParts[0] - 1, dateParts[1]);
        // Check for [YY, MM, DD]
    }
    else if (dateParts[0] < 100 && dateParts[1] <= 12 && dateParts[2] <= 31) {
        const year = (dateParts[0] <= thisYear ? 2000 : 1900) + dateParts[0];
        return new Date(year, dateParts[1] - 1, dateParts[2]);
    }
    return null;
}
/**
 * 'findDate' function
 *
 * //  { string } text
 * // { string }
 */
export function findDate(text) {
    if (!text) {
        return null;
    }
    let foundDate;
    // Match ...YYYY-MM-DD...
    foundDate = text.match(/(?:19|20)\d\d[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ](?:[012]?\d|3[01])(?!\d)/);
    if (foundDate) {
        return foundDate[0];
    }
    // Match ...MM-DD-YYYY...
    foundDate = text.match(/(?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ](?:19|20)\d\d(?!\d)/);
    if (foundDate) {
        return foundDate[0];
    }
    // Match MM-DD-YY...
    foundDate = text.match(/^(?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ]\d\d(?!\d)/);
    if (foundDate) {
        return foundDate[0];
    }
    // Match YY-MM-DD...
    foundDate = text.match(/^\d\d[-_\\\/\. ](?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])(?!\d)/);
    if (foundDate) {
        return foundDate[0];
    }
    // Match YYYYMMDD...
    foundDate = text.match(/^(?:19|20)\d\d(?:0\d|1[012])(?:[012]\d|3[01])/);
    if (foundDate) {
        return foundDate[0];
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS5mdW5jdGlvbnMuanMiLCJzb3VyY2VSb290Ijoibmc6Ly9hbmd1bGFyNi1qc29uLXNjaGVtYS1mb3JtLyIsInNvdXJjZXMiOlsibGliL3NoYXJlZC9kYXRlLmZ1bmN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFlLEVBQUU7SUFDbEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFVBQVUsSUFBSSxZQUFZLENBQUM7SUFDdEQsOERBQThEO0lBQzlELDRDQUE0QztJQUM1QyxJQUFJLE9BQU8sSUFBSSxLQUFLLFFBQVEsRUFBRTtRQUFFLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7S0FBRTtJQUM1RCxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxlQUFlLEVBQUU7UUFBRSxPQUFPLElBQUksQ0FBQztLQUFFO0lBQzlFLE1BQU0sVUFBVSxHQUFHLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNO1FBQ3hFLE1BQU0sRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDcEUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pHLE1BQU0sUUFBUSxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDaEcsTUFBTSxTQUFTLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNwRSxPQUFPLFVBQVU7U0FDZCxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUM7U0FDMUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNwRCxPQUFPLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUM5QyxPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztTQUM5QyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDeEQsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDMUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7U0FDMUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7U0FDMUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNqRCxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUM7U0FDbkMsT0FBTyxDQUFDLEtB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QztLQUFFO0lBQ3ZDLHlCQUF5QjtJQUN6QixTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyw0RUFBNEUsQ0FBQyxDQUFDO0lBQ3JHLElBQUksU0FBUyxFQUFFO1FBQUUsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBRTtJQUN2QyxvQkFBb0I7SUFDcEIsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsb0VBQW9FLENBQUMsQ0FBQztJQUM3RixJQUFJLFNBQVMsRUFBRTtRQUFFLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQUU7SUFDdkMsb0JBQW9CO0lBQ3BCLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG9FQUFvRSxDQUFDLENBQUM7SUFDN0YsSUFBSSxTQUFTLEVBQUU7UUFBRSxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUFFO0lBQ3ZDLG9CQUFvQjtJQUNwQixTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO0lBQ3hFLElBQUksU0FBUyxFQUFFO1FBQUUsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FBRTtBQUN6QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiAnZGF0ZVRvU3RyaW5nJyBmdW5jdGlvblxuICpcbiAqIC8vICB7IERhdGUgfCBzdHJpbmcgfSBkYXRlXG4gKiAvLyAgIG9wdGlvbnNcbiAqIC8vIHsgc3RyaW5nIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRhdGVUb1N0cmluZyhkYXRlLCBvcHRpb25zOiBhbnkgPSB7fSkge1xuICBjb25zdCBkYXRlRm9ybWF0ID0gb3B0aW9ucy5kYXRlRm9ybWF0IHx8ICdZWVlZLU1NLUREJztcbiAgLy8gVE9ETzogVXNlIG9wdGlvbnMubG9jYWxlIHRvIGNoYW5nZSBkZWZhdWx0IGZvcm1hdCBhbmQgbmFtZXNcbiAgLy8gY29uc3QgbG9jYWxlID0gb3B0aW9ucy5sb2NhbGUgfHwgJ2VuLVVTJztcbiAgaWYgKHR5cGVvZiBkYXRlID09PSAnc3RyaW5nJykgeyBkYXRlID0gc3RyaW5nVG9EYXRlKGRhdGUpOyB9XG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZGF0ZSkgIT09ICdbb2JqZWN0IERhdGVdJykgeyByZXR1cm4gbnVsbDsgfVxuICBjb25zdCBsb25nTW9udGhzID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJyxcbiAgICAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXTtcbiAgY29uc3Qgc2hvcnRNb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJywgJ09jdCcsICdOb3YnLCAnRGVjJ107XG4gIGNvbnN0IGxvbmdEYXlzID0gWydTdW5kYXknLCAnTW9uZGF5JywgJ1R1ZXNkYXknLCAnV2VkbmVzZGF5JywgJ1RodXJzZGF5JywgJ0ZyaWRheScsICdTYXR1cmRheSddO1xuICBjb25zdCBzaG9ydERheXMgPSBbJ1N1bicsICdNb24nLCAnVHVlJywgJ1dlZCcsICdUaHUnLCAnRnJpJywgJ1NhdCddO1xuICByZXR1cm4gZGF0ZUZvcm1hdFxuICAgIC5yZXBsYWNlKC9ZWVlZL2lnLCBkYXRlLmdldEZ1bGxZZWFyKCkgKyAnJylcbiAgICAucmVwbGFjZSgvWVkvaWcsIChkYXRlLmdldEZ1bGxZZWFyKCkgKyAnJykuc2xpY2UoLTIpKVxuICAgIC5yZXBsYWNlKC9NTU1NL2lnLCBsb25nTW9udGhzW2RhdGUuZ2V0TW9udGgoKV0pXG4gICAgLnJlcGxhY2UoL01NTS9pZywgc2hvcnRNb250aHNbZGF0ZS5nZXRNb250aCgpXSlcbiAgICAucmVwbGFjZSgvTU0vaWcsICgnMCcgKyAoZGF0ZS5nZXRNb250aCgpICsgMSkpLnNsaWNlKC0yKSlcbiAgICAucmVwbGFjZSgvTS9pZywgKGRhdGUuZ2V0TW9udGgoKSArIDEpICsgJycpXG4gICAgLnJlcGxhY2UoL0REREQvaWcsIGxvbmdEYXlzW2RhdGUuZ2V0RGF5KCldKVxuICAgIC5yZXBsYWNlKC9EREQvaWcsIHNob3J0RGF5c1tkYXRlLmdldERheSgpXSlcbiAgICAucmVwbGFjZSgvREQvaWcsICgnMCcgKyBkYXRlLmdldERhdGUoKSkuc2xpY2UoLTIpKVxuICAgIC5yZXBsYWNlKC9EL2lnLCBkYXRlLmdldERhdGUoKSArICcnKVxuICAgIC5yZXBsYWNlKC9TL2lnLCBvcmRpbmFsKGRhdGUuZ2V0RGF0ZSgpKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcmRpbmFsKG51bWJlcjogbnVtYmVyfHN0cmluZyk6IHN0cmluZyB7XG4gIGlmICh0eXBlb2YgbnVtYmVyID09PSAnbnVtYmVyJykgeyBudW1iZXIgPSBudW1iZXIgKyAnJzsgfVxuICBjb25zdCBsYXN0ID0gbnVtYmVyLnNsaWNlKC0xKTtcbiAgY29uc3QgbmV4dFRvTGFzdCA9IG51bWJlci5zbGljZSgtMiwgMSk7XG4gIHJldHVybiAobmV4dFRvTGFzdCAhPT0gJzEnICYmIHsgJzEnOiAnc3QnLCAnMic6ICduZCcsICczJzogJ3JkJyB9W2xhc3RdKSB8fCAndGgnO1xufVxuXG4vKipcbiAqICdzdHJpbmdUb0RhdGUnIGZ1bmN0aW9uXG4gKlxuICogLy8gIHsgc3RyaW5nIH0gZGF0ZVN0cmluZ1xuICogLy8geyBEYXRlIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0cmluZ1RvRGF0ZShkYXRlU3RyaW5nKSB7XG4gIGNvbnN0IGdldERhdGU6IHN0cmluZyA9IGZpbmREYXRlKGRhdGVTdHJpbmcpO1xuICBpZiAoIWdldERhdGUpIHsgcmV0dXJuIG51bGw7IH1cbiAgbGV0IGRhdGVQYXJ0czogbnVtYmVyW10gPSBbXTtcbiAgLy8gU3BsaXQgeC15LXogdG8gW3gsIHksIHpdXG4gIGlmICgvXlxcZCtbXlxcZF1cXGQrW15cXGRdXFxkKyQvLnRlc3QoZ2V0RGF0ZSkpIHtcbiAgICBkYXRlUGFydHMgPSBnZXREYXRlLnNwbGl0KC9bXlxcZF0vKS5tYXAocGFydCA9PiArcGFydCk7XG4gIC8vIFNwbGl0IHh4eHh5eXp6IHRvIFt4eHh4LCB5eSwgenpdXG4gIH0gZWxzZSBpZiAoL15cXGR7OH0kLy50ZXN0KGdldERhdGUpKSB7XG4gICAgZGF0ZVBhcnRzID0gWytnZXREYXRlLnNsaWNlKDAsIDQpLCArZ2V0RGF0ZS5zbGljZSg0LCA2KSwgK2dldERhdGUuc2xpY2UoNildO1xuICB9XG4gIGNvbnN0IHRoaXNZZWFyID0gKyhuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkgKyAnJykuc2xpY2UoLTIpO1xuICAvLyBDaGVjayBmb3IgW1lZWVksIE1NLCBERF1cbiAgaWYgKGRhdGVQYXJ0c1swXSA+IDEwMDAgJiYgZGF0ZVBhcnRzWzBdIDwgMjEwMCAmJiBkYXRlUGFydHNbMV0gPD0gMTIgJiYgZGF0ZVBhcnRzWzJdIDw9IDMxKSB7XG4gICAgcmV0dXJuIG5ldyBEYXRlKGRhdGVQYXJ0c1swXSwgZGF0ZVBhcnRzWzFdIC0gMSwgZGF0ZVBhcnRzWzJdKTtcbiAgLy8gQ2hlY2sgZm9yIFtNTSwgREQsIFlZWVldXG4gIH0gZWxzZSBpZiAoZGF0ZVBhcnRzWzBdIDw9IDEyICYmIGRhdGVQYXJ0c1sxXSA8PSAzMSAmJiBkYXRlUGFydHNbMl0gPiAxMDAwICYmIGRhdGVQYXJ0c1syXSA8IDIxMDApIHtcbiAgICByZXR1cm4gbmV3IERhdGUoZGF0ZVBhcnRzWzJdLCBkYXRlUGFydHNbMF0gLSAxLCBkYXRlUGFydHNbMV0pO1xuICAvLyBDaGVjayBmb3IgW01NLCBERCwgWVldXG4gIH0gZWxzZSBpZiAoZGF0ZVBhcnRzWzBdIDw9IDEyICYmIGRhdGVQYXJ0c1sxXSA8PSAzMSAmJiBkYXRlUGFydHNbMl0gPCAxMDApIHtcbiAgICBjb25zdCB5ZWFyID0gKGRhdGVQYXJ0c1syXSA8PSB0aGlzWWVhciA/IDIwMDAgOiAxOTAwKSArIGRhdGVQYXJ0c1syXTtcbiAgICByZXR1cm4gbmV3IERhdGUoeWVhciwgZGF0ZVBhcnRzWzBdIC0gMSwgZGF0ZVBhcnRzWzFdKTtcbiAgLy8gQ2hlY2sgZm9yIFtZWSwgTU0sIEREXVxuICB9IGVsc2UgaWYgKGRhdGVQYXJ0c1swXSA8IDEwMCAmJiBkYXRlUGFydHNbMV0gPD0gMTIgJiYgZGF0ZVBhcnRzWzJdIDw9IDMxKSB7XG4gICAgY29uc3QgeWVhciA9IChkYXRlUGFydHNbMF0gPD0gdGhpc1llYXIgPyAyMDAwIDogMTkwMCkgKyBkYXRlUGFydHNbMF07XG4gICAgcmV0dXJuIG5ldyBEYXRlKHllYXIsIGRhdGVQYXJ0c1sxXSAtIDEsIGRhdGVQYXJ0c1syXSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogJ2ZpbmREYXRlJyBmdW5jdGlvblxuICpcbiAqIC8vICB7IHN0cmluZyB9IHRleHRcbiAqIC8vIHsgc3RyaW5nIH1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmREYXRlKHRleHQpIHtcbiAgaWYgKCF0ZXh0KSB7IHJldHVybiBudWxsOyB9XG4gIGxldCBmb3VuZERhdGU6IGFueVtdO1xuICAvLyBNYXRjaCAuLi5ZWVlZLU1NLURELi4uXG4gIGZvdW5kRGF0ZSA9IHRleHQubWF0Y2goLyg/OjE5fDIwKVxcZFxcZFstX1xcXFxcXC9cXC4gXSg/OjA/XFxkfDFbMDEyXSlbLV9cXFxcXFwvXFwuIF0oPzpbMDEyXT9cXGR8M1swMV0pKD8hXFxkKS8pO1xuICBpZiAoZm91bmREYXRlKSB7IHJldHVybiBmb3VuZERhdGVbMF07IH1cbiAgLy8gTWF0Y2ggLi4uTU0tREQtWVlZWS4uLlxuICBmb3VuZERhdGUgPSB0ZXh0Lm1hdGNoKC8oPzpbMDEyXT9cXGR8M1swMV0pWy1fXFxcXFxcL1xcLiBdKD86MD9cXGR8MVswMTJdKVstX1xcXFxcXC9cXC4gXSg/OjE5fDIwKVxcZFxcZCg/IVxcZCkvKTtcbiAgaWYgKGZvdW5kRGF0ZSkgeyByZXR1cm4gZm91bmREYXRlWzBdOyB9XG4gIC8vIE1hdGNoIE1NLURELVlZLi4uXG4gIGZvdW5kRGF0ZSA9IHRleHQubWF0Y2goL14oPzpbMDEyXT9cXGR8M1swMV0pWy1fXFxcXFxcL1xcLiBdKD86MD9cXGR8MVswMTJdKVstX1xcXFxcXC9cXC4gXVxcZFxcZCg/IVxcZCkvKTtcbiAgaWYgKGZvdW5kRGF0ZSkgeyByZXR1cm4gZm91bmREYXRlWzBdOyB9XG4gIC8vIE1hdGNoIFlZLU1NLURELi4uXG4gIGZvdW5kRGF0ZSA9IHRleHQubWF0Y2goL15cXGRcXGRbLV9cXFxcXFwvXFwuIF0oPzpbMDEyXT9cXGR8M1swMV0pWy1fXFxcXFxcL1xcLiBdKD86MD9cXGR8MVswMTJdKSg/IVxcZCkvKTtcbiAgaWYgKGZvdW5kRGF0ZSkgeyByZXR1cm4gZm91bmREYXRlWzBdOyB9XG4gIC8vIE1hdGNoIFlZWVlNTURELi4uXG4gIGZvdW5kRGF0ZSA9IHRleHQubWF0Y2goL14oPzoxOXwyMClcXGRcXGQoPzowXFxkfDFbMDEyXSkoPzpbMDEyXVxcZHwzWzAxXSkvKTtcbiAgaWYgKGZvdW5kRGF0ZSkgeyByZXR1cm4gZm91bmREYXRlWzBdOyB9XG59XG4iXX0=