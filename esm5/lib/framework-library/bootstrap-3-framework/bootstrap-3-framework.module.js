import * as tslib_1 from "tslib";
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { JsonSchemaFormModule } from '../../json-schema-form.module';
import { JsonSchemaFormService } from '../../json-schema-form.service';
import { WidgetLibraryModule } from '../../widget-library/widget-library.module';
import { WidgetLibraryService } from '../../widget-library/widget-library.service';
import { Framework } from '../framework';
import { FrameworkLibraryService } from '../framework-library.service';
import { Bootstrap3FrameworkComponent } from './bootstrap-3-framework.component';
import { Bootstrap3Framework } from './bootstrap-3.framework';
var Bootstrap3FrameworkModule = /** @class */ (function () {
    function Bootstrap3FrameworkModule() {
    }
    Bootstrap3FrameworkModule = tslib_1.__decorate([
        NgModule({
            imports: [JsonSchemaFormModule, CommonModule, WidgetLibraryModule],
            declarations: [Bootstrap3FrameworkComponent],
            exports: [JsonSchemaFormModule, Bootstrap3FrameworkComponent],
            providers: [JsonSchemaFormService, FrameworkLibraryService, WidgetLibraryService,
                { provide: Framework, useClass: Bootstrap3Framework, multi: true }
            ],
            entryComponents: [Bootstrap3FrameworkComponent]
        })
    ], Bootstrap3FrameworkModule);
    return Bootstrap3FrameworkModule;
}());
export { Bootstrap3FrameworkModule };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdHN0cmFwLTMtZnJhbWV3b3JrLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiJuZzovL2FuZ3VsYXI2LWpzb24tc2NoZW1hLWZvcm0vIiwic291cmNlcyI6WyJsaWIvZnJhbWV3b3JrLWxpYnJhcnkvYm9vdHN0cmFwLTMtZnJhbWV3b3JrL2Jvb3RzdHJhcC0zLWZyYW1ld29yay5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3JFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLDRDQUE0QyxDQUFDO0FBQ2pGLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDZDQUE2QyxDQUFDO0FBQ25GLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDekMsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDdkUsT0FBTyxFQUFFLDRCQUE0QixFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFDakYsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFjOUQ7SUFBQTtJQUF5QyxDQUFDO0lBQTdCLHlCQUF5QjtRQVRyQyxRQUFRLENBQUM7WUFDUixPQUFPLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLENBQUM7WUFDbEUsWUFBWSxFQUFFLENBQUMsNEJBQTRCLENBQUM7WUFDNUMsT0FBTyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsNEJBQTRCLENBQUM7WUFDN0QsU0FBUyxFQUFFLENBQUMscUJBQXFCLEVBQUUsdUJBQXVCLEVBQUUsb0JBQW9CO2dCQUM5RSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLG1CQUFtQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7YUFDbkU7WUFDRCxlQUFlLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQztTQUNoRCxDQUFDO09BQ1cseUJBQXlCLENBQUk7SUFBRCxnQ0FBQztDQUFBLEFBQTFDLElBQTBDO1NBQTdCLHlCQUF5QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbW1vbk1vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5pbXBvcnQgeyBOZ01vZHVsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgSnNvblNjaGVtYUZvcm1Nb2R1bGUgfSBmcm9tICcuLi8uLi9qc29uLXNjaGVtYS1mb3JtLm1vZHVsZSc7XG5pbXBvcnQgeyBKc29uU2NoZW1hRm9ybVNlcnZpY2UgfSBmcm9tICcuLi8uLi9qc29uLXNjaGVtYS1mb3JtLnNlcnZpY2UnO1xuaW1wb3J0IHsgV2lkZ2V0TGlicmFyeU1vZHVsZSB9IGZyb20gJy4uLy4uL3dpZGdldC1saWJyYXJ5L3dpZGdldC1saWJyYXJ5Lm1vZHVsZSc7XG5pbXBvcnQgeyBXaWRnZXRMaWJyYXJ5U2VydmljZSB9IGZyb20gJy4uLy4uL3dpZGdldC1saWJyYXJ5L3dpZGdldC1saWJyYXJ5LnNlcnZpY2UnO1xuaW1wb3J0IHsgRnJhbWV3b3JrIH0gZnJvbSAnLi4vZnJhbWV3b3JrJztcbmltcG9ydCB7IEZyYW1ld29ya0xpYnJhcnlTZXJ2aWNlIH0gZnJvbSAnLi4vZnJhbWV3b3JrLWxpYnJhcnkuc2VydmljZSc7XG5pbXBvcnQgeyBCb290c3RyYXAzRnJhbWV3b3JrQ29tcG9uZW50IH0gZnJvbSAnLi9ib290c3RyYXAtMy1mcmFtZXdvcmsuY29tcG9uZW50JztcbmltcG9ydCB7IEJvb3RzdHJhcDNGcmFtZXdvcmsgfSBmcm9tICcuL2Jvb3RzdHJhcC0zLmZyYW1ld29yayc7XG5cblxuXG5cbkBOZ01vZHVsZSh7XG4gIGltcG9ydHM6IFtKc29uU2NoZW1hRm9ybU1vZHVsZSwgQ29tbW9uTW9kdWxlLCBXaWRnZXRMaWJyYXJ5TW9kdWxlXSxcbiAgZGVjbGFyYXRpb25zOiBbQm9vdHN0cmFwM0ZyYW1ld29ya0NvbXBvbmVudF0sXG4gIGV4cG9ydHM6IFtKc29uU2NoZW1hRm9ybU1vZHVsZSwgQm9vdHN0cmFwM0ZyYW1ld29ya0NvbXBvbmVudF0sXG4gIHByb3ZpZGVyczogW0pzb25TY2hlbWFGb3JtU2VydmljZSwgRnJhbWV3b3JrTGlicmFyeVNlcnZpY2UsIFdpZGdldExpYnJhcnlTZXJ2aWNlLFxuICAgIHsgcHJvdmlkZTogRnJhbWV3b3JrLCB1c2VDbGFzczogQm9vdHN0cmFwM0ZyYW1ld29yaywgbXVsdGk6IHRydWUgfVxuICBdLFxuICBlbnRyeUNvbXBvbmVudHM6IFtCb290c3RyYXAzRnJhbWV3b3JrQ29tcG9uZW50XVxufSlcbmV4cG9ydCBjbGFzcyBCb290c3RyYXAzRnJhbWV3b3JrTW9kdWxlIHsgfVxuIl19