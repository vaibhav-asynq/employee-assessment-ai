#!/usr/bin/env python3
"""
PostgreSQL Database Inspector
----------------------------
Script to inspect PostgreSQL/RDS database tables, showing table structure,
record counts, and sample data.
"""

import psycopg2
import argparse
from tabulate import tabulate  # For pretty-printing tables
import pandas as pd

def get_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Inspect PostgreSQL database tables')
    parser.add_argument('--host', default='tom-database.cfiimuk0i05v.us-east-1.rds.amazonaws.com',
                        help='PostgreSQL host (RDS endpoint)')
    parser.add_argument('--port', default=5432, type=int, help='PostgreSQL port')
    parser.add_argument('--dbname', '-d', default='employee_assessment', help='Database name')
    parser.add_argument('--user', '-u', default='postgres', help='Database user')
    parser.add_argument('--password', '-p', default='72Os8xZlXg1uTTFF9uN7', help='Database password')
    parser.add_argument('--table', '-t', help='Specific table to inspect (optional)')
    parser.add_argument('--sample-size', '-s', default=5, type=int, help='Number of sample rows to display')
    
    return parser.parse_args()

def get_tables(conn):
    """Get list of all tables in the database"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        return [row[0] for row in cur.fetchall()]

def get_table_count(conn, table_name):
    """Get number of records in a table"""
    with conn.cursor() as cur:
        cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        return cur.fetchone()[0]

def get_table_columns(conn, table_name):
    """Get column information for a table"""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = %s
            ORDER BY ordinal_position
        """, (table_name,))
        return cur.fetchall()

def get_table_sample(conn, table_name, sample_size):
    """Get sample rows from a table"""
    # Use psycopg2 cursor to fetch data
    with conn.cursor() as cur:
        cur.execute(f'SELECT * FROM "{table_name}" LIMIT {sample_size}')
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        
        # Convert to DataFrame
        df = pd.DataFrame(rows, columns=columns)
        return df

def inspect_table(conn, table_name, sample_size):
    """Inspect a single table and print information"""
    print(f"\n{'='*80}")
    print(f"TABLE: {table_name}")
    print(f"{'='*80}")
    
    # Get record count
    count = get_table_count(conn, table_name)
    print(f"Record count: {count:,}")
    
    # Get column information
    columns = get_table_columns(conn, table_name)
    print("\nCOLUMNS:")
    print(tabulate(columns, headers=["Column Name", "Data Type"]))
    
    # Get sample data
    if count > 0:
        print(f"\nSAMPLE DATA ({min(count, sample_size)} rows):")
        sample = get_table_sample(conn, table_name, sample_size)
        print(sample.to_string(index=False))

def main():
    """Main function"""
    args = get_args()
    
    # Connect to PostgreSQL
    try:
        conn = psycopg2.connect(
            host=args.host,
            port=args.port,
            dbname=args.dbname,
            user=args.user,
            password=args.password
        )
        print(f"Connected to PostgreSQL at {args.host}")
        
        if args.table:
            # Inspect specific table
            inspect_table(conn, args.table, args.sample_size)
        else:
            # Get all tables
            tables = get_tables(conn)
            print(f"Found {len(tables)} tables in database '{args.dbname}':")
            for i, table in enumerate(tables, 1):
                print(f"{i}. {table}")
            
            # Inspect each table
            for table in tables:
                inspect_table(conn, table, args.sample_size)
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        if 'conn' in locals() and conn is not None:
            conn.close()

if __name__ == "__main__":
    main()
