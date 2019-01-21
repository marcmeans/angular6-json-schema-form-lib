import * as tslib_1 from "tslib";
import { Bootstrap4Framework } from './bootstrap-4.framework';
import { Bootstrap4FrameworkComponent } from './bootstrap-4-framework.component';
import { CommonModule } from '@angular/common';
import { Framework } from '../framework';
import { FrameworkLibraryService } from '../framework-library.service';
import { JsonSchemaFormModule } from '../../json-schema-form.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { NgModule } from '@angular/core';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { WidgetLibraryService } from '../../widget-library/widget-library.service';
var Bootstrap4FrameworkModule = /** @class */ (function () {
    function Bootstrap4FrameworkModule() {
    }
    Bootstrap4FrameworkModule = tslib_1.__decorate([
        NgModule({
            imports: [JsonSchemaFormModule, CommonModule, WidgetLibraryModule],
            declarations: [Bootstrap4FrameworkComponent],
            exports: [JsonSchemaFormModule, Bootstrap4FrameworkComponent],
            providers: [JsonSchemaFormService, FrameworkLibraryService, WidgetLibraryService,
                { provide: Framework, useClass: Bootstrap4Framework, multi: true }
            ],
            entryComponents: [Bootstrap4FrameworkComponent]
        })
    ], Bootstrap4FrameworkModule);
    return Bootstrap4FrameworkModule;
}());
export { Bootstrap4FrameworkModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdHN0cmFwLTQtZnJhbWV3b3JrLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2FuZ3VsYXI2LWpzb24tc2NoZW1hLWZvcm0vIiwic291cmNlcyI6WyJsaWIvZnJhbWV3b3JrLWxpYnJhcnkvYm9vdHN0cmFwLTQtZnJhbWV3b3JrL2Jvb3RzdHJhcC00LWZyYW1ld29yay5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzlELE9BQU8sRUFBRSw0QkFBNEIsRUFBRSxNQUFNLG1DQUFtQyxDQUFDO0FBQ2pGLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQ3pDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDekMsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sNENBQTRDLENBQUM7QUFDakYsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFZbkY7SUFBQTtJQUF5QyxDQUFDO0lBQTdCLHlCQUF5QjtRQVRyQyxRQUFRLENBQUM7WUFDUixPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLENBQUM7WUFDbEUsWUFBWSxFQUFFLENBQUMsNEJBQTRCLENBQUM7WUFDNUMsT0FBTyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsNEJBQTRCLENBQUM7WUFDN0QsU0FBUyxFQUFFLENBQUMscUJBQXFCLEVBQUUsdUJBQXVCLEVBQUUsb0JBQW9CO2dCQUM5RSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7YUFDbkU7WUFDRCxlQUFlLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQztTQUNoRCxDQUFDO09BQ1cseUJBQXlCLENBQUk7SUFBRCxnQ0FBQztDQUFBLEFBQTFDLElBQTBDO1NBQTdCLHlCQUF5QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEJvb3RzdHJhcDRGcmFtZXdvcmsgfSBmcm9tICcuL2Jvb3RzdHJhcC00LmZyYW1ld29yayc7XG5pbXBvcnQgeyBCb290c3RyYXA0RnJhbWV3b3JrQ29tcG9uZW50IH0gZnJvbSAnLi9ib290c3RyYXAtNC1mcmFtZXdvcmsuY29tcG9uZW50JztcbmltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBGcmFtZXdvcmsgfSBmcm9tICcuLi9mcmFtZXdvcmsnO1xuaW1wb3J0IHsgRnJhbWV3b3JrTGlicmFyeVNlcnZpY2UgfSBmcm9tICcuLi9mcmFtZXdvcmstbGlicmFyeS5zZXJ2aWNlJztcbmltcG9ydCB7IEpzb25TY2hlbWFGb3JtTW9kdWxlIH0gZnJvbSAnLi4vLi4vanNvbi1zY2hlbWEtZm9ybS5tb2R1bGUnO1xuaW1wb3J0IHsgSnNvblNjaGVtYUZvcm1TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vanNvbi1zY2hlbWEtZm9ybS5zZXJ2aWNlJztcbmltcG9ydCB7IE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBXaWRnZXRMaWJyYXJ5TW9kdWxlIH0gZnJvbSAnLi4vLi4vd2lkZ2V0LWxpYnJhcnkvd2lkZ2V0LWxpYnJhcnkubW9kdWxlJztcbmltcG9ydCB7IFdpZGdldExpYnJhcnlTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vd2lkZ2V0LWxpYnJhcnkvd2lkZ2V0LWxpYnJhcnkuc2VydmljZSc7XG5cblxuQE5nTW9kdWxlKHtcbiAgaW1wb3J0czogW0pzb25TY2hlbWFGb3JtTW9kdWxlLCBDb21tb25Nb2R1bGUsIFdpZGdldExpYnJhcnlNb2R1bGVdLFxuICBkZWNsYXJhdGlvbnM6IFtCb290c3RyYXA0RnJhbWV3b3JrQ29tcG9uZW50XSxcbiAgZXhwb3J0czogW0pzb25TY2hlbWFGb3JtTW9kdWxlLCBCb290c3RyYXA0RnJhbWV3b3JrQ29tcG9uZW50XSxcbiAgcHJvdmlkZXJzOiBbSnNvblNjaGVtYUZvcm1TZXJ2aWNlLCBGcmFtZXdvcmtMaWJyYXJ5U2VydmljZSwgV2lkZ2V0TGlicmFyeVNlcnZpY2UsXG4gICAgeyBwcm92aWRlOiBGcmFtZXdvcmssIHVzZUNsYXNzOiBCb290c3RyYXA0RnJhbWV3b3JrLCBtdWx0aTogdHJ1ZSB9XG4gIF0sXG4gIGVudHJ5Q29tcG9uZW50czogW0Jvb3RzdHJhcDRGcmFtZXdvcmtDb21wb25lbnRdXG59KVxuZXhwb3J0IGNsYXNzIEJvb3RzdHJhcDRGcmFtZXdvcmtNb2R1bGUgeyB9XG4iXX0=