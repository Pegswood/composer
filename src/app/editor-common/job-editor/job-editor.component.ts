import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef, EventEmitter, Output
} from "@angular/core";
import {ObjectHelper as OH} from "../../helpers/object.helper";
import {CommandInputParameterModel} from "cwlts/models/d2sb";
import {StatusBarService} from "../../core/status-bar/status-bar.service";
import {EditorInspectorService} from "../inspector/editor-inspector.service";

/**
 * Job Editor modifies the test values of the job json.
 */
@Component({
    selector: "ct-job-editor",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div *ngFor="let group of inputGroups">
            <ct-form-panel>
                <div class="tc-header">{{ group.name }}</div>
                <div class="tc-body">
                    <form (change)="onJobFormChange($event)">
                        <div *ngFor="let input of group.inputs" >
                            
                            <label>{{ input.id }}:</label>
                            <ct-job-editor-entry [input]="input" 
                                                 [value]="job.inputs[input.id]"
                                                 (update)="jobValueUpdate(input.id, $event)">
                            </ct-job-editor-entry>
                            <div class="form-control-label">{{ input.description }}</div>
                        
                        </div>
                    </form>
                </div>
            </ct-form-panel>
        </div>
    `
})
export class JobEditorComponent implements OnChanges {

    /**
     * Existing CWL job metadata
     */
    @Input()
    public job: { allocatedResources?: { cpu: number, mem: number }, inputs?: {} } = {};

    /**
     * CWL app input definitions
     */
    @Input()
    public inputs: CommandInputParameterModel[] = [];

    @Output()
    public update = new EventEmitter();

    constructor(private cdr: ChangeDetectorRef,
                private statusBar: StatusBarService,
                private inspector: EditorInspectorService) {
    }

    /**
     * Inputs grouped and sorted the way they should be presented
     */
    public inputGroups: { name: string, inputs: CommandInputParameterModel[] }[] = [];

    private onJobFormChange(event) {
    }

    private jobValueUpdate(inputId, jobValue) {
        this.statusBar.instant(`Updated job value of ${inputId}.`);

        this.job = {...{}, ...this.job, inputs: {...this.job.inputs, [inputId]: jobValue}};
        this.update.emit(this.job);
        this.cdr.markForCheck();

    }

    ngOnChanges(changes: SimpleChanges) {
        // Whenever inputs are updated, regroup them and sort them for display
        const grouped = this.inputs.reduce((acc, item) => {
            const cat = OH.getProperty(item, "customProps.sbg:category", "Uncategorized");
            return {...acc, ...{[cat]: (acc[cat] || []).concat(item)}};
        }, {});

        // Order groups alphabetically
        this.inputGroups = Object.keys(grouped).sort((a, b) => a.localeCompare(b)).map(key => ({
            name: key,
            inputs: grouped[key]
        }));
    }

    ngOnDestroy(){
        this.inspector.hide();
    }
}
