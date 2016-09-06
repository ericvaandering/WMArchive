#!/usr/bin/env python
# Author: Nils Fischer <n.fischer@viwid.com>
# Tool to run performance aggregations over the FWJR database in HDFS.

import argparse
import datetime
import subprocess
import os
import time

import logging
logger = logging.getLogger(__name__)

def parse_source(s):

    def path_from_day(day):
        return '/cms/wmarchive/avro/{year:04d}/{month:02d}/{day:02d}'.format(year=day.year, month=day.month, day=day.day)

    try:
        return path_from_day(datetime.datetime.strptime(s, '%Y-%m-%d').date())
    except ValueError:
        pass
    try:
        return path_from_day(datetime.date.today() - datetime.timedelta(days=int(s)))
    except:
        pass

    return s

class OptionParser():
    def __init__(self):
        "User based option parser"
        self.parser = argparse.ArgumentParser(\
                description="Run performance aggregations over the FWJR database.")
        self.parser.add_argument('source', type=parse_source, \
                help="The FWJR data to aggregate over. Provide either a date formatted like YYYY-MM-DD, a number of days ago, e.g. 0 for today or 1 for yesterday, or a path in the HDFS such as /cms/wmarchive/avro/2016/08/30.")
        self.parser.add_argument('--precision', '-p', \
                choices=[ 'hour', 'day', 'week', 'month' ], required=True, \
                help="The temporal precision of aggregation.")
        self.parser.add_argument('--use_myspark', action='store_true', \
                help="Use legacy myspark script.")
        self.parser.set_defaults(use_myspark=False)

def main():
    # Parse command line arguments
    optmgr  = OptionParser()
    args = optmgr.parser.parse_args()

    logging.basicConfig(level=logging.DEBUG)

    start_time = time.time()
    logger.info("Aggregating {} performance data in {}...".format(args.precision.replace('y', 'i') + 'ly', args.source))

    if args.use_myspark:

        from WMArchive.PySpark import RecordAggregator
        aggregation_script = RecordAggregator.__file__.replace('.pyc', '.py')
        logger.debug("Using myspark aggregation script in {}.".format(aggregation_script))

        subprocess.call([ os.path.join(os.path.dirname(__file__), 'myspark'), '--hdir=hdfs://' + args.source, '--schema=hdfs:///cms/wmarchive/avro/schemas/current.avsc', '--script=' + aggregation_script ])

    else:

        logger.debug("Using fwjr_aggregator aggregation script.")

        subprocess.call([ os.path.join(os.path.dirname(__file__), 'fwjr_aggregator'), '--hdir=' + args.source, '--precision=' + args.precision ])

    logger.info("Completed FWJR performance data aggregation in {} seconds.".format(time.time() - start_time))

if __name__ == '__main__':
    main()
