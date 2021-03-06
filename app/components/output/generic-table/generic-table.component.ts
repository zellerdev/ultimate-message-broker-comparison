import {
    Component,
    Input,
    Output,
    EventEmitter,
    ApplicationRef,
    ChangeDetectionStrategy,
    AfterViewChecked,
    OnChanges
} from "@angular/core";
import { TableData, Data, CriteriaSelection } from "./../../comparison/shared/index";
import { ComparisonCitationService } from "./../../comparison/components/comparison-citation.service";
import { ComparisonConfigService } from "../../comparison/components/comparison-config.service";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
declare let anchors;

@Component({
    selector: 'generictable',
    templateUrl: './generic-table.component.html',
    styleUrls: ['./generic-table.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericTableComponent implements AfterViewChecked, OnChanges {
    private counter: number = 0;
    private table;

    @Input() display: boolean = false;
    @Input() settings: boolean = false;
    @Input() columns: Array<TableData> = new Array<TableData>();

    @Input() data: Array<Data> = new Array<Data>();
    @Input() query: {[name: string]: CriteriaSelection;} = {};
    @Input() displayTemplate: boolean = false;

    @Input() citationServ: ComparisonCitationService;

    @Output() settingsCallback: EventEmitter<any> = new EventEmitter();
    @Output() showDetails: EventEmitter<any> = new EventEmitter();

    @Input() changeNum: number = 0;

    @Input() order: Array<String> = new Array<String>();
    @Output() orderChange: EventEmitter<any> = new EventEmitter();
    @Input() orderOption: Array<number> = new Array<number>();
    @Output() orderOptionChange: EventEmitter<any> = new EventEmitter();

    private ctrlCounter: number = 0;

    constructor(private ar: ApplicationRef,
                private confServ: ComparisonConfigService,
                private sanitization: DomSanitizer) {
    }

    private orderClick(e: MouseEvent, value: string) {
        let pos: number = this.order.findIndex(name => name == value);
        if (e.ctrlKey) {
            this.ctrlCounter = this.order[this.ctrlCounter] == value ? this.ctrlCounter : this.ctrlCounter + 1;
        } else {
            this.ctrlCounter = 0;
        }
        if (typeof pos != 'undefined' && pos >= 0) {
            this.order[this.ctrlCounter] = value;
            this.orderOption[this.ctrlCounter] = this.orderOption[pos] == 1 ? -1 : 1;
            this.orderOption[pos] = pos != this.ctrlCounter ? 0 : this.orderOption[this.ctrlCounter];
        } else {
            this.order[this.ctrlCounter] = value;
            this.orderOption[this.ctrlCounter] = 1;
        }
        if (this.ctrlCounter == 0) {
            for (let i = 1; i < this.orderOption.length; i++) {
                this.orderOption[i] = 0;
            }
        }
        this.orderChange.emit(this.order);
        this.orderOptionChange.emit(this.orderOption);
        this.table.trigger('reflow');
    }

    private displayOrder(value: string, option: number): boolean {
        if (this.order.length === 0 && this.orderOption.length === 0) {
            this.order[this.ctrlCounter] = "tag";
            this.orderOption[this.ctrlCounter] = 1;
        }
        return this.order.findIndex(val => val == value) >= 0 && this.orderOption[this.order.findIndex(val => val == value)] == option;
    }

    ngAfterViewChecked(): void {
        this.table = (<any>$("table.table.table-hover"));
        this.table.floatThead();
        anchors.options = {
            placement: 'right'
        };
        anchors.add('.anchored');
    }

    ngOnChanges(): void {
        this.update();
    }

    public update(): void {
        if (this.table != null) {
            this.table.trigger('reflow');
        }
    }

    public shouldBeShown(data: Data) {
        if (this.confServ.comparison && this.confServ.comparison.displayall) {
            return true;
        }
        let val = true;
        for (let column of this.confServ.tableDataSet.getTableDataArray()) {
            if (column.display && data.properties[column.tag] != null && data.properties[column.tag].plain != "") {
                return true;
            }
            if (column.display && data.properties[column.tag] != null) {
                val = false;
            }
        }
        return val;
    }

    public getColor(column: TableData, label: string): SafeHtml {
        return this.sanitization.bypassSecurityTrustStyle(column.type.colors.getColor(label));
    }

    public getForegroundColor(color: any): SafeHtml {
        const h = Number.parseInt(color["changingThisBreaksApplicationSecurity"].substr(4, 3).split(',')[0]);
        const s = 100;
        const l = 88;
        const rgb = this.hslToRgb(h, s, l);
        const yiq = ((rgb[0]*299)+(rgb[1]*587)+(rgb[2]*114))/1000;
        return this.sanitization.bypassSecurityTrustStyle((yiq >= 128) ? 'black' : 'white');
    }

    private hslToRgb(h, s, l){
        let r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            let hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }
}