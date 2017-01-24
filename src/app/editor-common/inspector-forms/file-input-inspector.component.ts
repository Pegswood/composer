import {
    Component, Input, SimpleChanges, Output, EventEmitter,
    ChangeDetectionStrategy
} from "@angular/core";
import {FormGroup, FormControl} from "@angular/forms";
import {Observable, Subject} from "rxjs";

interface CWLFile {
    path?: string;
    size?: number;
    contents?: string;
    metadata?: {};
    secondaryFiles?: [{ path?: string }];
}

@Component({
    selector: "ct-file-input-inspector",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <form (change)="rawChange.next($event)" [formGroup]="formGroup">
            <!--Path-->
            <div class="form-group">
                <label>Path</label>
                <input class="form-control" formControlName="path"/>
            </div>
            
            <!--Size-->
            <div class="form-group">
                <label>Size</label>
                <input class="form-control" formControlName="size"/>
            </div>
            
            <!--Secondary Files-->
            <div class="form-group">
                <label>Secondary Files</label>
                <compact-list formControlName="secondaryFiles"></compact-list>
            </div>
            
            <!--Content-->
            <div class="form-group">
                <label>Content</label>
                <textarea rows="10" class="form-control"  formControlName="contents"></textarea>
            </div>
        </form>
    `
})
export class FileInputInspector {

    /** Input data for the component */
    @Input()
    public input: CWLFile = {};

    /** Emits when the form data changed */
    @Output()
    public update = new EventEmitter();

    /** Paths that will be displayed as tags in the compact list component */
    public secondaryFilePaths: string[] = [];

    /** Form group that holds all the data */
    public formGroup: FormGroup;

    /** Changes on the native form fields */
    public rawChange = new Subject<any>();

    ngOnInit() {
        this.formGroup = new FormGroup({
            path: new FormControl(this.input.path),
            size: new FormControl(this.input.size),
            secondaryFiles: new FormControl(this.secondaryFilePaths),
            contents: new FormControl(this.input.contents)
        });

        // We need to combine changes from two different sources
        Observable.merge(
            // Watch for changes of values on the secondaryFiles tag array
            this.formGroup.get("secondaryFiles").valueChanges

            // We need to compare arrays in order not to feed an array with the same content
            // back into the loop. This works since elements are plain strings.
                .distinctUntilChanged((a, b) => a.toString() === b.toString()),

            // Watch for changes on the plain form fields
            this.rawChange
        )
        // Take the plain form values
            .map(() => this.formGroup.getRawValue())

            // Merge plain form values with the se condaryFiles values map onto their original structure
            .map(val => ({...val, secondaryFiles: val.secondaryFiles.map(path => ({path}))}))

            // Then emit gathered data as an update from the component
            .subscribe(data => this.update.emit(data));
    }

    ngOnChanges(changes: SimpleChanges) {
        // secondaryFiles is an array of files/directories, we just need their paths
        this.secondaryFilePaths = (changes["input"].currentValue.secondaryFiles || []).map(v => v.path);

        // Form group is not present on first call
        if (this.formGroup) {
            this.formGroup.get("secondaryFiles").setValue(this.secondaryFilePaths);
        }
    }
}
