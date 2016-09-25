# keboola-ex-ooyala

An Ooyala Video Analytics extractor for Keboola Connection


General syntax of Reporting GET

[GET] /v3/analytics/reports/?
  report_type=type
  &dimensions=dimensions
  &metrics=metrics
  &filters=filter_type=='filter_value'
  &start_date=date
  &end_date=date
  &other_params
  &api_key=your_api_key

Dimensions

values: [ asset, country, region, dma, state, device_type, domain, url, os, browser, pcode, player_id ]

http://support.ooyala.com/developers/documentation/api/analytics_v3_api_reporting_dimensions.html


Filter

http://support.ooyala.com/developers/documentation/api/analytics_v3_api_reporting_filters.html
