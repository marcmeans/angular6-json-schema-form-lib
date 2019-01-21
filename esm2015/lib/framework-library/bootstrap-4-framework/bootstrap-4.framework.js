import * as tslib_1 from "tslib";
import { Bootstrap4FrameworkComponent } from './bootstrap-4-framework.component';
import { Framework } from '../framework';
import { Injectable } from '@angular/core';
// Bootstrap 4 Framework
// https://github.com/ng-bootstrap/ng-bootstrap
let Bootstrap4Framework = class Bootstrap4Framework extends Framework {
    // Bootstrap 4 Framework
    // https://github.com/ng-bootstrap/ng-bootstrap
    constructor() {
        super(...arguments);
        this.name = 'bootstrap-4';
        this.framework = Bootstrap4FrameworkComponent;
        this.stylesheets = [
            '//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/css/bootstrap.min.css'
        ];
        this.scripts = [
            '//code.jquery.com/jquery-3.2.1.slim.min.js',
            '//cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.3/umd/popper.min.js',
            '//maxcdn.bootstrapcdn.com/bootstrap/4.0.0-beta.2/js/bootstrap.min.js',
        ];
    }
};
Bootstrap4Framework = tslib_1.__decorate([
    Injectable()
], Bootstrap4Framework);
export { Bootstrap4Framework };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdHN0cmFwLTQuZnJhbWV3b3JrLmpzIiwic291cmNlUm9vdCI6Im5nOi8vYW5ndWxhcjYtanNvbi1zY2hlbWEtZm9ybS8iLCJzb3VyY2VzIjpbImxpYi9mcmFtZXdvcmstbGlicmFyeS9ib290c3RyYXAtNC1mcmFtZXdvcmsvYm9vdHN0cmFwLTQuZnJhbWV3b3JrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUNqRixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFM0Msd0JBQXdCO0FBQ3hCLCtDQUErQztBQUcvQyxJQUFhLG1CQUFtQixHQUFoQyxNQUFhLG1CQUFvQixTQUFRLFNBQVM7SUFKbEQsd0JBQXdCO0lBQ3hCLCtDQUErQztJQUUvQzs7UUFFRSxTQUFJLEdBQUcsYUFBYSxDQUFDO1FBRXJCLGNBQVMsR0FBRyw0QkFBNEIsQ0FBQztRQUV6QyxnQkFBVyxHQUFHO1lBQ1osd0VBQXdFO1NBQ3pFLENBQUM7UUFFRixZQUFPLEdBQUc7WUFDUiw0Q0FBNEM7WUFDNUMscUVBQXFFO1lBQ3JFLHNFQUFzRTtTQUN2RSxDQUFDO0lBQ0osQ0FBQztDQUFBLENBQUE7QUFkWSxtQkFBbUI7SUFEL0IsVUFBVSxFQUFFO0dBQ0EsbUJBQW1CLENBYy9CO1NBZFksbUJBQW1CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQm9vdHN0cmFwNEZyYW1ld29ya0NvbXBvbmVudCB9IGZyb20gJy4vYm9vdHN0cmFwLTQtZnJhbWV3b3JrLmNvbXBvbmVudCc7XG5pbXBvcnQgeyBGcmFtZXdvcmsgfSBmcm9tICcuLi9mcmFtZXdvcmsnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuXG4vLyBCb290c3RyYXAgNCBGcmFtZXdvcmtcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9uZy1ib290c3RyYXAvbmctYm9vdHN0cmFwXG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBCb290c3RyYXA0RnJhbWV3b3JrIGV4dGVuZHMgRnJhbWV3b3JrIHtcbiAgbmFtZSA9ICdib290c3RyYXAtNCc7XG5cbiAgZnJhbWV3b3JrID0gQm9vdHN0cmFwNEZyYW1ld29ya0NvbXBvbmVudDtcblxuICBzdHlsZXNoZWV0cyA9IFtcbiAgICAnLy9tYXhjZG4uYm9vdHN0cmFwY2RuLmNvbS9ib290c3RyYXAvNC4wLjAtYmV0YS4yL2Nzcy9ib290c3RyYXAubWluLmNzcydcbiAgXTtcblxuICBzY3JpcHRzID0gW1xuICAgICcvL2NvZGUuanF1ZXJ5LmNvbS9qcXVlcnktMy4yLjEuc2xpbS5taW4uanMnLFxuICAgICcvL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9wb3BwZXIuanMvMS4xMi4zL3VtZC9wb3BwZXIubWluLmpzJyxcbiAgICAnLy9tYXhjZG4uYm9vdHN0cmFwY2RuLmNvbS9ib290c3RyYXAvNC4wLjAtYmV0YS4yL2pzL2Jvb3RzdHJhcC5taW4uanMnLFxuICBdO1xufVxuIl19