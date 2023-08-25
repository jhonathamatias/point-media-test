export interface Sheet {
  name: string;
  rows: string[];
}

export default class GoogleSheetsApi {
  private static readonly key = 'AIzaSyCzlYz2WFOFErYrDbkv9McyeJH2dpV9Mv4';
  private static readonly baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  private spreadsheetId: string;

  constructor(spreadsheetId: string) {
    this.spreadsheetId = spreadsheetId;
  }

  public async getSheetData(): Promise<Sheet[] | null> {
    try {
      const { sheets } = await fetch(`${GoogleSheetsApi.baseUrl}/${this.spreadsheetId}?includeGridData=true&key=${GoogleSheetsApi.key}`)
        .then(resp => resp.text())
        .then(text => JSON.parse(text));
  
      return this.parser(sheets);
    } catch (err) {
      return null;
    }
  }

  private parser(sheets: any[]): Sheet[] {
    const { rowData } = sheets[0].data[0];
    const columns = rowData[0];

    rowData.shift();

    const sheet: Sheet[] = [];

    columns.values.forEach((value: any, index: number) => {
      sheet[index] = {
        name: value.formattedValue,
        rows: rowData.map((row: any) => row.values[index].formattedValue)
      };
    });

    return sheet;
  }
}