# Ooyala Analytics (v3) Keboola Extractor

An Ooyala Analytics extractor for Keboola Connection is a component that extracts data from Ooyala Analytics (v3) backend. Written in Node.js with utilization of Babel/ES6/ES7 functionality.

## General overview

The main purpose of this extractor is to download data from ([v3 Analytics (Ooyala IQ) API](http://support.ooyala.com/developers/documentation/concepts/ooyala_iq_api_reference.html)). You can specify several dimensions which produce results for the all metrics that are available in Ooyala analytical system.

In the current version of the extractor you can't modify these metrics as well as apply any special filter on data. All you can currently do is to specify parameters startDate, endDate and dimensions and let the extractor download everything within that period and dimension.

## Analytics Endpoint

General syntax of Reporting GET which is implemented in this extractor:

    [GET] /v3/analytics/reports/?
      report_type='performance'
      &dimensions=dimensions
      &start_date=date
      &end_date=date
      &other_params
      &api_key=your_api_key

### Dimensions

You can specify up to 3 dimensions. The allowed values are: **asset**, **country**, **region**, **dma**, **state**, **device_type**, **domain**, **url**, **os**, **browser**, **pcode**, **player_id**. Check out ([the documentation](http://support.ooyala.com/developers/documentation/api/analytics_v3_api_reporting_dimensions.html)) for more information.

### Dates

There are two date parameters, **startDate** and **endDate**. They help you to download aggregated data within specified date period. Keep in mind, that the date mask **YYYY-MM-DD** must be specified, otherwise the Ooyala API won't recognize the date values and fail. The extractor always download full extract based on these two parameters. There are optionals and if you don't specify them, some default values will be used. For the **startDate** the value is going to be set to **2016-01-01** and for **endDate** the default settings is **today() - 1**.

### Bucket name and table name

There are also parameters **bucket** and **table**. There are pointing out to Keboola destination where the output object is going to be stored. They are optional as well. If you don't specify them, the default values will be used. In default mode, **bucket** is going to be set to **out.c-ooyala** and **table** to **performance**.

### Pagination

There is also a parameter **pageSize**. This parameter is optional and you can ignore it (I implemented that for potential benchmark in future). There is a default value in place set to **1000**. But in general, the bigger the number is, the lower amount of records is going to be made.

### Sample configuration

A possible configuration in Keboola Connection might look like following:

    {
      "#apiKey": "Ooyala Api Key",
      "#apiSecret": "Ooyala Api Secret",
      "bucket": "out.c-radek_test",
      "table": "ooyala_test",
      "dimensions": [ "asset", "country" ],
      "startDate": "2016-09-25",
      "endDate": "2016-09-25",
      "pageSize": 500
    }
