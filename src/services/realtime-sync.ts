/**
 * Real-time sync service for fetching data from Supabase
 * This service syncs jobs and technical reports from the web app's database
 */

import { getSupabase, initializeSupabase } from '../lib/supabase';

export interface SyncResult {
  success: boolean;
  jobsCount?: number;
  reportsCount?: number;
  formTemplatesCount?: number;
  formInstancesCount?: number;
  assetsCount?: number;
  error?: string;
}

/**
 * Initialize the sync service with Supabase credentials
 */
export async function initializeSyncService(): Promise<void> {
  try {
    console.log('🔧 Initializing sync service...');
    const config = await window.electronAPI.getSupabaseConfig();
    
    console.log('📡 Supabase config received:', {
      success: config.success,
      hasUrl: !!config.url,
      hasKey: !!config.anonKey,
      urlPreview: config.url ? config.url.substring(0, 30) + '...' : 'missing'
    });
    
    if (!config.success || !config.url || !config.anonKey) {
      throw new Error('Supabase configuration not found. Please check your .env file has SUPABASE_URL and SUPABASE_ANON_KEY');
    }
    
    initializeSupabase(config.url, config.anonKey);
    console.log('✅ Sync service initialized with Supabase');
  } catch (error) {
    console.error('❌ Failed to initialize sync service:', error);
    throw error;
  }
}

/**
 * Sync jobs from Supabase to local SQLite
 * Also fetches customer data from common.customers table
 */
export async function syncJobsFromSupabase(_userId?: string): Promise<SyncResult> {
  try {
    console.log('🔄 Starting job sync from Supabase...');
    console.log('📊 Fetching ONLY in_progress jobs from neta_ops.jobs table...');
    
    const supabase = getSupabase();
    
    // Fetch ONLY jobs with status = 'in_progress' from neta_ops schema
    const query = supabase
      .schema('neta_ops')
      .from('jobs')
      .select('*')
      .eq('status', 'in_progress'); // Only get in_progress jobs
    
    console.log('📡 Executing Supabase query (filtering by status=in_progress)...');
    const { data: jobs, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching jobs from Supabase:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log(`✅ Fetched ${jobs?.length || 0} jobs from Supabase`);
    
    // Log sample of first job for debugging
    if (jobs && jobs.length > 0) {
      console.log('📝 Sample job data:', {
        id: jobs[0].id,
        job_number: jobs[0].job_number,
        title: jobs[0].title,
        status: jobs[0].status,
        division: jobs[0].division,
        location: jobs[0].location,
        customer_id: jobs[0].customer_id
      });
    }
    
    // STEP 1: Fetch customer data for all jobs that have customer_id
    console.log('👤 Fetching customer data from common.customers...');
    const customerIds = jobs?.filter(j => j.customer_id).map(j => j.customer_id) || [];
    const uniqueCustomerIds = [...new Set(customerIds)];
    console.log(`  Found ${uniqueCustomerIds.length} unique customer IDs`);
    
    const customerMap: Record<string, any> = {};
    
    if (uniqueCustomerIds.length > 0) {
      const { data: customers, error: customerError } = await supabase
        .schema('common')
        .from('customers')
        .select('id, name, company_name, address, phone, email')
        .in('id', uniqueCustomerIds);
      
      if (customerError) {
        console.error('⚠️ Error fetching customers (continuing without customer data):', customerError.message);
      } else if (customers) {
        console.log(`✅ Fetched ${customers.length} customers`);
        customers.forEach((c: any) => {
          customerMap[c.id] = c;
        });
      }
    }
    
    // STEP 2: Clear existing jobs from local database
    console.log('🗑️  Clearing old jobs from local database...');
    await window.electronAPI.dbQuery('jobs', 'deleteAll', {});
    
    // STEP 3: Insert fresh jobs into local SQLite with customer data
    let jobsInserted = 0;
    if (jobs && jobs.length > 0) {
      console.log(`💾 Inserting ${jobs.length} fresh jobs into local database...`);
      
      for (const job of jobs) {
        // Get customer data if available
        const customer = job.customer_id ? customerMap[job.customer_id] : null;
        
        // Map Supabase job fields to local schema, enriching with customer data
        const localJob = {
          id: job.id,
          job_number: job.job_number,
          title: job.title,
          description: job.description || null,
          status: job.status,
          division: job.division || null,
          location: job.location || null,
          address: job.address || job.site_address || null,
          start_date: job.start_date || null,
          due_date: job.due_date || null,
          completed_date: job.completed_date || null,
          budget: job.budget || null,
          priority: job.priority || null,
          customer_id: job.customer_id || null,
          // Use customer data from common.customers table
          customer_name: customer?.name || customer?.company_name || job.customer_name || null,
          customer_company: customer?.company_name || job.customer_company || null,
          customer_email: customer?.email || job.customer_email || null,
          customer_phone: customer?.phone || job.customer_phone || null,
          customer_address: customer?.address || job.customer_address || job.site_address || null,
          assigned_to: job.assigned_to || null,
          notes: job.notes || null,
          is_dirty: false, // Synced data is not dirty
          last_sync_at: new Date().toISOString(),
          created_at: job.created_at,
          updated_at: job.updated_at,
        };
        
        const customerInfo = customer ? `(Customer: ${customer.company_name || customer.name})` : '(No customer)';
        console.log(`  - Inserting: ${job.job_number} ${job.title} ${customerInfo}`);
        const result = await window.electronAPI.dbQuery('jobs', 'upsertJob', localJob);
        if (result.success) {
          jobsInserted++;
        } else {
          console.error(`  ❌ Failed to insert job ${job.job_number}:`, result.error);
        }
      }
    } else {
      console.warn('⚠️ No jobs found in Supabase. Check your database.');
    }
    
    console.log(`✅ Successfully synced ${jobsInserted} jobs to local database (with customer data)`);
    
    return {
      success: true,
      jobsCount: jobsInserted,
    };
  } catch (error: any) {
    console.error('Job sync failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during job sync',
    };
  }
}

/**
 * Sync technical reports for a specific job from Supabase to local SQLite
 */
export async function syncReportsForJob(jobId: string): Promise<SyncResult> {
  try {
    console.log(`🔄 Starting report sync for job ${jobId}...`);
    const supabase = getSupabase();
    
    // Fetch reports from neta_ops schema
    console.log(`📡 Querying: SELECT * FROM neta_ops.technical_reports WHERE job_id = '${jobId}'`);
    const { data: reports, error } = await supabase
      .schema('neta_ops')
      .from('technical_reports')
      .select('*')
      .eq('job_id', jobId);
    
    if (error) {
      console.error(`❌ Error fetching reports from Supabase for job ${jobId}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log(`✅ Fetched ${reports?.length || 0} reports for job ${jobId}`);
    
    // If no reports found, that's okay - just return success with 0 count
    if (!reports || reports.length === 0) {
      console.log(`ℹ️  No reports found for job ${jobId} - this is normal if no reports exist yet`);
      return {
        success: true,
        reportsCount: 0,
      };
    }
    
    // Insert reports into local SQLite
    let reportsInserted = 0;
    console.log(`💾 Inserting ${reports.length} reports into local database...`);
    
    for (const report of reports) {
      const localReport = {
        id: report.id,
        job_id: report.job_id,
        title: report.title,
        report_type: report.report_type,
        status: report.status || 'draft',
        report_data: report.report_data ? JSON.stringify(report.report_data) : '{}',
        submitted_by: report.submitted_by || null,
        submitted_at: report.submitted_at || null,
        reviewed_by: report.reviewed_by || null,
        reviewed_at: report.reviewed_at || null,
        revision_history: report.revision_history ? JSON.stringify(report.revision_history) : '[]',
        current_version: report.current_version || 1,
        review_comments: report.review_comments || null,
        approved_at: report.approved_at || null,
        issued_at: report.issued_at || null,
        sent_at: report.sent_at || null,
        is_dirty: 0, // Use 0 for SQLite boolean
        last_sync_at: new Date().toISOString(),
        created_at: report.created_at,
        updated_at: report.updated_at,
      };
      
      console.log(`  - Inserting report: ${report.title}`);
      const result = await window.electronAPI.dbQuery('reports', 'upsertReport', localReport);
      if (result.success) {
        reportsInserted++;
      } else {
        console.error(`  ❌ Failed to insert report ${report.title}:`, result.error);
      }
    }
    
    console.log(`✅ Successfully synced ${reportsInserted} reports for job ${jobId}`);
    
    return {
      success: true,
      reportsCount: reportsInserted,
    };
  } catch (error: any) {
    console.error('Report sync failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during report sync',
    };
  }
}

/**
 * Sync custom form templates from Supabase to local SQLite
 */
export async function syncFormTemplatesFromSupabase(): Promise<SyncResult> {
  try {
    console.log('🔄 Starting form templates sync from Supabase...');
    const supabase = getSupabase();
    
    // Fetch active form templates from neta_ops schema
    console.log('📡 Querying: SELECT * FROM neta_ops.custom_form_templates WHERE is_active = true');
    const { data: templates, error } = await supabase
      .schema('neta_ops')
      .from('custom_form_templates')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error('❌ Error fetching form templates from Supabase:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log(`✅ Fetched ${templates?.length || 0} form templates from Supabase`);
    
    if (!templates || templates.length === 0) {
      console.log('ℹ️  No form templates found - this is normal if none exist yet');
      return {
        success: true,
        formTemplatesCount: 0,
      };
    }
    
    // Insert templates into local SQLite
    let templatesInserted = 0;
    console.log(`💾 Inserting ${templates.length} form templates into local database...`);
    
    for (const template of templates) {
      const localTemplate = {
        id: template.id,
        name: template.name,
        report_type: template.neta_section || 'custom',
        template_schema: template.structure ? JSON.stringify(template.structure) : '{}',
        version: 1,
        is_active: template.is_active ? 1 : 0,
        last_sync_at: new Date().toISOString(),
        created_at: template.created_at,
        updated_at: template.updated_at,
      };
      
      console.log(`  - Inserting template: ${template.name}`);
      const result = await window.electronAPI.dbQuery('report_templates', 'upsertTemplate', localTemplate);
      if (result.success) {
        templatesInserted++;
      } else {
        console.error(`  ❌ Failed to insert template ${template.name}:`, result.error);
      }
    }
    
    console.log(`✅ Successfully synced ${templatesInserted} form templates`);
    
    return {
      success: true,
      formTemplatesCount: templatesInserted,
    };
  } catch (error: any) {
    console.error('Form templates sync failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during form templates sync',
    };
  }
}

/**
 * Sync custom form instances for a specific job from Supabase to local SQLite
 */
export async function syncFormInstancesForJob(jobId: string): Promise<SyncResult> {
  try {
    console.log(`🔄 Starting form instances sync for job ${jobId}...`);
    const supabase = getSupabase();
    
    // Fetch form instances from neta_ops schema
    console.log(`📡 Querying: SELECT * FROM neta_ops.custom_form_instances WHERE job_id = '${jobId}'`);
    const { data: instances, error } = await supabase
      .schema('neta_ops')
      .from('custom_form_instances')
      .select('*')
      .eq('job_id', jobId);
    
    if (error) {
      console.error(`❌ Error fetching form instances from Supabase for job ${jobId}:`, error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    console.log(`✅ Fetched ${instances?.length || 0} form instances for job ${jobId}`);
    
    if (!instances || instances.length === 0) {
      console.log(`ℹ️  No form instances found for job ${jobId}`);
      return {
        success: true,
        formInstancesCount: 0,
      };
    }
    
    // Insert form instances into local SQLite as technical_reports
    let instancesInserted = 0;
    console.log(`💾 Inserting ${instances.length} form instances as reports into local database...`);
    
    for (const instance of instances) {
      // Map custom_form_instances to technical_reports structure
      // Preserve template metadata in report_data so we can sync back up correctly
      
      // Ensure instance.data is properly parsed if it's a string
      let formData: any = {};
      if (typeof instance.data === 'string') {
        try {
          formData = JSON.parse(instance.data);
        } catch (e) {
          console.warn('Failed to parse instance.data as JSON:', e);
          formData = {};
        }
      } else if (instance.data && typeof instance.data === 'object') {
        // Deep clone to ensure we preserve all nested structures
        formData = JSON.parse(JSON.stringify(instance.data));
      }
      
      // Preserve ALL data including sections with all their nested structures (rows, fields, values)
      // Add metadata fields at the top level for syncing back up
      const enrichedData = {
        ...formData, // This preserves jobInfo and sections with all nested data
        // Preserve template metadata for syncing back up
        template_id: instance.template_id || null,
        template_name: instance.template_name || 'Custom Form',
        neta_section: instance.neta_section || null,
        status: instance.status || 'PASS', // Preserve PASS/FAIL status
      };
      
      // Log for debugging - check if sections are present
      if (enrichedData.sections) {
        const sectionIds = Object.keys(enrichedData.sections);
        console.log(`  - Form has ${sectionIds.length} sections:`, sectionIds);
        // Log first section structure to verify data is preserved
        if (sectionIds.length > 0) {
          const firstSection = enrichedData.sections[sectionIds[0]];
          if (firstSection.rows) {
            console.log(`    - Section "${sectionIds[0]}" has ${firstSection.rows.length} rows`);
          } else if (firstSection.fields) {
            console.log(`    - Section "${sectionIds[0]}" has fields:`, Object.keys(firstSection.fields));
          } else if (firstSection.value !== undefined) {
            console.log(`    - Section "${sectionIds[0]}" has value`);
          }
        }
      }

      const localReport = {
        id: instance.id,
        job_id: instance.job_id,
        title: instance.template_name || 'Custom Form',
        report_type: instance.neta_section || 'custom_form',
        status: 'draft', // Default status for form instances
        report_data: JSON.stringify(enrichedData),
        submitted_by: instance.user_id || null,
        submitted_at: null,
        reviewed_by: null,
        reviewed_at: null,
        revision_history: '[]',
        current_version: 1,
        review_comments: null,
        approved_at: null,
        issued_at: null,
        sent_at: null,
        is_dirty: 0,
        last_sync_at: new Date().toISOString(),
        created_at: instance.created_at,
        updated_at: instance.updated_at,
      };
      
      console.log(`  - Inserting form instance: ${instance.template_name}`);
      const result = await window.electronAPI.dbQuery('reports', 'upsertReport', localReport);
      if (result.success) {
        instancesInserted++;
      } else {
        console.error(`  ❌ Failed to insert form instance:`, result.error);
      }
    }
    
    console.log(`✅ Successfully synced ${instancesInserted} form instances for job ${jobId}`);
    
    return {
      success: true,
      formInstancesCount: instancesInserted,
    };
  } catch (error: any) {
    console.error('Form instances sync failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during form instances sync',
    };
  }
}

/**
 * Full sync: DOWNLOAD ONLY (does not upload to Supabase)
 * 
 * This function:
 * ✅ Downloads jobs from Supabase → saves to local SQLite
 * ✅ Downloads reports from Supabase → saves to local SQLite  
 * ❌ Does NOT upload offline changes back to Supabase
 */
export async function performFullSync(userId?: string): Promise<SyncResult> {
  try {
    console.log('=== Starting Full Sync (DOWNLOAD ONLY) ===');
    console.log('⬇️  This will only DOWNLOAD data from Supabase');
    console.log('⛔ This will NOT upload offline changes');
    
    // First sync form templates (needed for creating/editing forms)
    console.log('\n📝 Syncing form templates from Supabase...');
    console.log('🗑️  Clearing old form templates from local database...');
    await window.electronAPI.dbQuery('report_templates', 'deleteAll', {});
    
    const templateResult = await syncFormTemplatesFromSupabase();
    if (!templateResult.success) {
      console.error('⚠️  Form templates sync failed, but continuing with other data...');
    }
    
    // Then sync jobs
    const jobResult = await syncJobsFromSupabase(userId);
    
    if (!jobResult.success) {
      return jobResult;
    }
    
    // Then sync ALL reports AND assets (not filtered by job status)
    console.log('\n📋 Syncing ALL reports and assets from Supabase...');
    
    // Clear existing reports first
    console.log('🗑️  Clearing old reports from local database...');
    await window.electronAPI.dbQuery('reports', 'deleteAll', {});
    
    // Also need to sync assets table for status information
    console.log('🗑️  Clearing old assets from local database...');
    await window.electronAPI.dbQuery('assets', 'deleteAll', {});
    
    // Get all job IDs from local database
    const jobsResult = await window.electronAPI.dbQuery('jobs', 'getAll', {});
    const jobIds = jobsResult.success && jobsResult.data 
      ? jobsResult.data.map((job: any) => job.id)
      : [];
    
    console.log(`📊 Found ${jobIds.length} jobs locally`);
    
    let totalReports = 0;
    let assetsInserted = 0;
    const supabase = getSupabase();
    
    if (jobIds.length === 0) {
      console.warn('⚠️  No jobs found - skipping report sync');
    } else {
      // NOTE: We do NOT query neta_ops.technical_reports because that table doesn't exist in Supabase.
      // All reports are stored in their individual tables (e.g., automatic_transfer_switch_ats_reports, 
      // medium_voltage_circuit_breaker_mts_reports, etc.).
      // Reports will be fetched later based on asset references (see asset URL parsing below).
      console.log(`\n📡 Reports will be synced via asset references (no central technical_reports table in Supabase)...`);
      
      // Sync form instances (custom forms filled out for jobs) - only for in-progress jobs
      console.log(`\n📋 Syncing form instances for ${jobIds.length} in-progress jobs from Supabase...`);
      console.log(`📡 Querying custom_form_instances...`);
      
      let allFormInstances: any[] | null = null;
      let instancesError: any = null;
      
      try {
        const instancesResult = await Promise.race([
          supabase.schema('neta_ops').from('custom_form_instances').select('*').in('job_id', jobIds),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('custom_form_instances query timed out')), 30000))
        ]);
        allFormInstances = instancesResult.data;
        instancesError = instancesResult.error;
      } catch (timeoutError: any) {
        console.error('❌ custom_form_instances query timed out:', timeoutError.message);
        instancesError = { message: 'Query timed out' };
      }
      
      if (instancesError) {
        console.error('❌ Error fetching form instances from Supabase:', instancesError);
      } else {
        console.log(`✅ Fetched ${allFormInstances?.length || 0} form instances from Supabase`);
        
        if (allFormInstances && allFormInstances.length > 0) {
          console.log(`💾 Inserting ${allFormInstances.length} form instances as reports...`);
          
          let formInstancesInserted = 0;
          for (const instance of allFormInstances) {
            // Preserve template metadata in report_data so we can sync back up correctly
            
            // Ensure instance.data is properly parsed if it's a string
            let formData: any = {};
            if (typeof instance.data === 'string') {
              try {
                formData = JSON.parse(instance.data);
              } catch (e) {
                console.warn('Failed to parse instance.data as JSON:', e);
                formData = {};
              }
            } else if (instance.data && typeof instance.data === 'object') {
              // Deep clone to ensure we preserve all nested structures
              formData = JSON.parse(JSON.stringify(instance.data));
            }
            
            // Preserve ALL data including sections with all their nested structures (rows, fields, values)
            // Add metadata fields at the top level for syncing back up
            const enrichedData = {
              ...formData, // This preserves jobInfo and sections with all nested data
              // Preserve template metadata for syncing back up
              template_id: instance.template_id || null,
              template_name: instance.template_name || 'Custom Form',
              neta_section: instance.neta_section || null,
              status: instance.status || 'PASS', // Preserve PASS/FAIL status
            };

            const localReport = {
              id: instance.id,
              job_id: instance.job_id,
              title: instance.template_name || 'Custom Form',
              report_type: instance.neta_section || 'custom_form',
              status: 'draft',
              report_data: JSON.stringify(enrichedData),
              submitted_by: instance.user_id || null,
              submitted_at: null,
              reviewed_by: null,
              reviewed_at: null,
              revision_history: '[]',
              current_version: 1,
              review_comments: null,
              approved_at: null,
              issued_at: null,
              sent_at: null,
              is_dirty: 0,
              last_sync_at: new Date().toISOString(),
              created_at: instance.created_at,
              updated_at: instance.updated_at,
            };
            
            const result = await window.electronAPI.dbQuery('reports', 'upsertReport', localReport);
            if (result.success) {
              formInstancesInserted++;
            }
          }
          
          console.log(`✅ Successfully synced ${formInstancesInserted} form instances`);
          totalReports += formInstancesInserted;
        }
      }
      
      // Now sync assets (which contain the status information)
      console.log('\n📦 Syncing assets and job_assets from Supabase...');
      
      // Clear existing job_assets FIRST (foreign key constraint)
      console.log('🗑️  Clearing old job_assets from local database...');
      await window.electronAPI.dbQuery('job_assets', 'deleteAll', {});
      
      console.log('🗑️  Clearing old assets from local database...');
      await window.electronAPI.dbQuery('assets', 'deleteAll', {});
      
      console.log(`📡 Fetching job_assets for ${jobIds.length} jobs...`);
      
      // Use a timeout to prevent hanging
      const jobAssetsPromise = supabase
        .schema('neta_ops')
        .from('job_assets')
        .select('id, job_id, asset_id, user_id, created_at')
        .in('job_id', jobIds);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('job_assets query timed out after 30 seconds')), 30000);
      });
      
      let jobAssetLinks: any[] | null = null;
      let linksError: any = null;
      
      try {
        const result = await Promise.race([jobAssetsPromise, timeoutPromise]);
        jobAssetLinks = result.data;
        linksError = result.error;
      } catch (timeoutError: any) {
        console.error('❌ job_assets query timed out:', timeoutError.message);
        linksError = { message: 'Query timed out' };
      }
      
      if (linksError) {
        console.error('❌ Error fetching job_assets:', linksError);
      } else {
        console.log(`Found ${jobAssetLinks?.length || 0} job_asset links`);
        
        if (jobAssetLinks && jobAssetLinks.length > 0) {
          // First, fetch and insert the assets (must come before job_assets due to foreign key)
          const assetIds = jobAssetLinks.map((link: any) => link.asset_id);
          
          const { data: assetsData, error: assetsError } = await supabase
            .schema('neta_ops')
            .from('assets')
            .select('id, name, file_url, created_at, status, approved_at, sent_at')
            .in('id', assetIds);
          
          if (assetsError) {
            console.error('❌ Error fetching assets:', assetsError);
          } else {
            console.log(`✅ Fetched ${assetsData?.length || 0} assets`);
            
            // Log asset status breakdown
            if (assetsData && assetsData.length > 0) {
              const statusCounts: Record<string, number> = {};
              assetsData.forEach((asset: any) => {
                const status = asset.status || 'not started';
                statusCounts[status] = (statusCounts[status] || 0) + 1;
              });
              console.log('📊 Asset status breakdown:', statusCounts);
            }
            
            // Insert assets into local database
            let assetsFailed = 0;
            const failureReasons: Record<string, number> = {};
            
            if (assetsData && assetsData.length > 0) {
              console.log(`💾 Inserting ${assetsData.length} assets into local database...`);
              
              for (let i = 0; i < assetsData.length; i++) {
                const asset = assetsData[i];
                
                try {
                  const localAsset = {
                    id: asset.id,
                    name: asset.name,
                    file_url: asset.file_url,
                    status: asset.status || 'not started',
                    approved_at: asset.approved_at || null,
                    sent_at: asset.sent_at || null,
                    created_at: asset.created_at,
                  };
                  
                  const result = await window.electronAPI.dbQuery('assets', 'upsertAsset', localAsset);
                  if (result.success) {
                    assetsInserted++;
                  } else {
                    assetsFailed++;
                    const errorMsg = result.error || 'Unknown error';
                    failureReasons[errorMsg] = (failureReasons[errorMsg] || 0) + 1;
                    console.error(`  ❌ FAILED to insert asset ${asset.id}: ${result.error}`);
                  }
                } catch (err: any) {
                  assetsFailed++;
                  const errorMsg = err.message || 'Exception during insert';
                  failureReasons[errorMsg] = (failureReasons[errorMsg] || 0) + 1;
                  console.error(`  ❌ EXCEPTION inserting asset ${asset.id}:`, err);
                }
              }
            }
            
            console.log(`✅ Successfully synced ${assetsInserted}/${assetsData?.length || 0} assets`);
            if (assetsFailed > 0) {
              console.error(`❌ Failed to sync ${assetsFailed} assets`);
              console.error('Failure reasons:', failureReasons);
            }
            
            // IMPORTANT: Check if any assets reference reports (file_url starts with "report:")
            // Each report type has its own table in Supabase (e.g., automatic_transfer_switch_ats_reports)
            // We need to query the correct table based on the URL pattern
            console.log('\n🔍 Checking for report references in assets...');
            
            // Slug-to-table mapping from the online website code
            const slugToTable: Record<string, string> = {
              'switchgear-switchboard-assemblies-ats25': 'switchgear_switchboard_ats25_reports',
              'panelboard-assemblies-ats25': 'panelboard_assemblies_ats25_reports',
              'panelboard-report': 'panelboard_reports',
              'switchgear-report': 'switchgear_reports',
              'dry-type-transformer': 'transformer_reports',
              'large-dry-type-transformer-report': 'large_transformer_reports',
              'large-dry-type-transformer': 'large_transformer_reports',
              'large-dry-type-transformer-mts-report': 'large_dry_type_transformer_mts_reports',
              'large-dry-type-xfmr-mts-report': 'large_dry_type_transformer_mts_reports',
              'liquid-xfmr-visual-mts-report': 'liquid_xfmr_visual_mts_reports',
              'low-voltage-switch-report': 'low_voltage_switch_reports',
              'medium-voltage-switch-oil-report': 'medium_voltage_switch_oil_reports',
              'medium-voltage-switch-sf6': 'medium_voltage_switch_sf6_reports',
              'medium-voltage-switch-sf6-report': 'medium_voltage_switch_sf6_reports',
              'potential-transformer-ats-report': 'potential_transformer_ats_reports',
              'low-voltage-panelboard-small-breaker-report': 'low_voltage_panelboard_small_breaker_reports',
              'medium-voltage-circuit-breaker-report': 'medium_voltage_circuit_breaker_reports',
              'medium-voltage-circuit-breaker-mts-report': 'medium_voltage_circuit_breaker_mts_reports',
              'medium-voltage-vlf-mts-report': 'medium_voltage_vlf_mts_reports',
              'medium-voltage-cable-vlf-test-mts': 'medium_voltage_cable_vlf_test',
              'medium-voltage-vlf': 'medium_voltage_vlf_mts_reports',
              'medium-voltage-vlf-tan-delta': 'tandelta_reports',
              'medium-voltage-vlf-tan-delta-mts': 'tandelta_mts_reports',
              'electrical-tan-delta-test-mts-form': 'tandelta_mts_reports',
              'medium-voltage-cable-vlf-test': 'medium_voltage_cable_vlf_test',
              'current-transformer-test-ats-report': 'current_transformer_test_ats_reports',
              '12-current-transformer-test-ats-report': 'current_transformer_test_ats_reports',
              '12-current-transformer-test-mts-report': 'current_transformer_test_mts_reports',
              '13-voltage-potential-transformer-test-mts-report': 'voltage_potential_transformer_mts_reports',
              '23-medium-voltage-motor-starter-mts-report': 'medium_voltage_motor_starter_mts_reports',
              '23-medium-voltage-switch-mts-report': 'medium_voltage_switch_mts_reports',
              'metal-enclosed-busway': 'metal_enclosed_busway_reports',
              'low-voltage-circuit-breaker-thermal-magnetic-mts-report': 'low_voltage_circuit_breaker_thermal_magnetic_mts_reports',
              'low-voltage-circuit-breaker-electronic-trip-ats-report': 'low_voltage_circuit_breaker_electronic_trip_ats',
              'low-voltage-circuit-breaker-electronic-trip-ats-primary-injection': 'low_voltage_circuit_breaker_electronic_trip_ats',
              '8-low-voltage-circuit-breaker-electronic-trip-unit-ats-primary-injection': 'low_voltage_circuit_breaker_electronic_trip_ats',
              'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report': 'low_voltage_circuit_breaker_electronic_trip_ats',
              'low-voltage-circuit-breaker-thermal-magnetic-ats-report': 'low_voltage_circuit_breaker_thermal_magnetic_ats',
              'automatic-transfer-switch-ats-report': 'automatic_transfer_switch_ats_reports',
              'low-voltage-circuit-breaker-electronic-trip-mts-report': 'low_voltage_circuit_breaker_electronic_trip_mts',
              'low-voltage-circuit-breaker-electronic-trip-mts': 'low_voltage_circuit_breaker_electronic_trip_mts',
              'low-voltage-circuit-breaker-electronic-trip-unit-mts': 'low_voltage_circuit_breaker_electronic_trip_mts',
              'two-small-dry-typer-xfmr-mts-report': 'two_small_dry_type_xfmr_mts_reports',
              'low-voltage-cable-test-3sets': 'low_voltage_cable_test_3sets',
              'low-voltage-cable-test-12sets': 'low_voltage_cable_test_12sets',
              'low-voltage-cable-test-20sets': 'low_voltage_cable_test_20sets',
              'low-voltage-switch-multi-device-test': 'low_voltage_switch_multi_device_reports',
              'two-small-dry-typer-xfmr-ats-report': 'two_small_dry_type_xfmr_ats_reports',
              'small-lv-dry-type-transformer-ats25': 'small_lv_dry_type_transformer_ats25_reports',
              'switchgear-panelboard-mts-report': 'switchgear_panelboard_mts_reports',
              'liquid-filled-transformer': 'liquid_filled_transformer_reports',
              'liquid-filled-xfmr-ats25': 'liquid_filled_xfmr_ats25_reports',
              'oil-inspection': 'oil_inspection_reports',
              'low-voltage-switch-maint-mts-report': 'low_voltage_switch_maint_mts_reports',
              '6-low-voltage-switch-maint-mts-report': 'low_voltage_switch_maint_mts_reports',
              'grounding-fall-of-potential-slope-method': 'grounding_fall_of_potential_slope_method_test_reports',
              'grounding-fall-of-potential-slope-method-test': 'grounding_fall_of_potential_slope_method_test_reports',
              'grounding-system-master': 'grounding_system_master_reports',
              'low-voltage-switch-multi-device-report': 'low_voltage_switch_multi_device_test_reports',
              'tan-delta-test-mts': 'tan_delta_test_mts',
              'automatic-transfer-switch-ats': 'automatic_transfer_switch_ats_reports',
              'generated-document': 'generated_documents'
            };
            
            const reportReferences: Array<{ reportId: string; tableName: string; assetName: string; slug: string }> = [];
            
            assetsData.forEach((asset: any) => {
              if (asset.file_url && asset.file_url.startsWith('report:')) {
                // Extract report info from URL: "report:/jobs/{jobId}/{report-type-slug}/{reportId}"
                // Example: "report:/jobs/abc123/automatic-transfer-switch-ats/def456"
                // Sometimes has query params like ?returnToAssets=true
                const urlParts = asset.file_url.split('/');
                let reportId = urlParts[urlParts.length - 1];
                const slug = urlParts[urlParts.length - 2]; // e.g., "automatic-transfer-switch-ats"
                
                // Strip query parameters from reportId if present (e.g., "uuid?returnToAssets=true" -> "uuid")
                if (reportId.includes('?')) {
                  reportId = reportId.split('?')[0];
                }
                
                // Look up the table name using the mapping
                const tableName = slugToTable[slug];
                
                if (reportId && tableName && !reportReferences.find(r => r.reportId === reportId)) {
                  reportReferences.push({ reportId, tableName, assetName: asset.name, slug }); // Store slug for report_type
                } else if (reportId && !tableName) {
                  console.warn(`    ⚠️  Unknown report slug: "${slug}" for asset "${asset.name}"`);
                }
              }
            });
            
            console.log(`📋 Found ${reportReferences.length} report references across ${new Set(reportReferences.map(r => r.tableName)).size} different report types`);
            
            if (reportReferences.length > 0) {
              console.log('📡 Fetching reports from their specific Supabase tables...');
              
              // Group reports by table for efficient querying
              const reportsByTable = new Map<string, Array<{ reportId: string; assetName: string; slug: string }>>();
              reportReferences.forEach(ref => {
                if (!reportsByTable.has(ref.tableName)) {
                  reportsByTable.set(ref.tableName, []);
                }
                reportsByTable.get(ref.tableName)!.push({ reportId: ref.reportId, assetName: ref.assetName, slug: ref.slug });
              });
              
              console.log(`📊 Will query ${reportsByTable.size} different report tables`);
              
              const allFetchedReports: any[] = [];
              
              // Query each table
              for (const [tableName, reports] of reportsByTable.entries()) {
                try {
                  console.log(`  📡 Fetching ${reports.length} reports from ${tableName}...`);
                  
                  const reportIds = reports.map(r => r.reportId);
                  console.log(`     Report IDs: ${reportIds.map(id => id.substring(0, 8) + '...').join(', ')}`);
                  
                  const { data: tableReports, error: tableError } = await supabase
                    .schema('neta_ops')
                    .from(tableName)
                    .select('*')
                    .in('id', reportIds);
                  
                  if (tableError) {
                    console.error(`    ❌ Error fetching from ${tableName}:`, tableError.message);
                    console.error(`    Error code: ${tableError.code}, details:`, tableError.details);
                    continue;
                  }
                  
                  if (tableReports && tableReports.length > 0) {
                    console.log(`    ✅ Fetched ${tableReports.length} reports from ${tableName}`);
                    // Add source table metadata to each report
                    tableReports.forEach((report: any) => {
                      const assetInfo = reports.find(r => r.reportId === report.id);
                      console.log(`       - Report ${report.id.substring(0, 8)}... (${assetInfo?.assetName || 'Unknown'}) [slug: ${assetInfo?.slug}]`);
                      allFetchedReports.push({
                        ...report,
                        _source_table: tableName,
                        _asset_name: assetInfo?.assetName || 'Unknown',
                        _slug: assetInfo?.slug || 'unknown' // Store the slug for report_type
                      });
                    });
                  } else {
                    console.log(`    ℹ️  No reports found in ${tableName} for the requested IDs`);
                  }
                } catch (err: any) {
                  console.error(`    ❌ Exception querying ${tableName}:`, err.message);
                }
              }
              
              console.log(`✅ Successfully fetched ${allFetchedReports.length} reports from ${reportsByTable.size} tables`);
              
              const referencedReports = allFetchedReports;
              
              // Process fetched reports
              if (referencedReports.length > 0) {
                console.log(`\n💾 Processing ${referencedReports.length} fetched reports...`);
                  // These reports might belong to OTHER jobs (not in-progress)
                  // Fetch those parent jobs too to avoid foreign key errors
                  const parentJobIds = referencedReports.map((r: any) => r.job_id).filter((id: string) => !jobIds.includes(id));
                  
                  if (parentJobIds.length > 0) {
                    console.log(`📦 Fetching ${parentJobIds.length} parent jobs for referenced reports...`);
                    
                    const { data: parentJobs, error: parentJobsError } = await supabase
                      .schema('neta_ops')
                      .from('jobs')
                      .select('*')
                      .in('id', parentJobIds);
                    
                    if (parentJobsError) {
                      console.error('❌ Error fetching parent jobs:', parentJobsError);
                    } else if (parentJobs && parentJobs.length > 0) {
                      console.log(`✅ Fetched ${parentJobs.length} parent jobs`);
                      
                      // Insert parent jobs
                      for (const job of parentJobs) {
                        const localJob = {
                          id: job.id,
                          job_number: job.job_number,
                          client_name: job.client_name || 'Unknown',
                          site_name: job.site_name || '',
                          site_address: job.site_address || '',
                          status: job.status || 'unknown',
                          start_date: job.start_date,
                          end_date: job.end_date,
                          notes: job.notes || '',
                          is_dirty: 0,
                          last_sync_at: new Date().toISOString(),
                          created_at: job.created_at,
                          updated_at: job.updated_at,
                        };
                        
                        await window.electronAPI.dbQuery('jobs', 'upsertJob', localJob);
                      }
                      
                      console.log(`✅ Inserted ${parentJobs.length} parent jobs for referenced reports`);
                    }
                  }
                  
                  let referencedReportsInserted = 0;
                  let referencedReportsFailed = 0;
                  
                  for (const report of referencedReports) {
                    console.log(`  📝 Processing report ${report.id.substring(0, 8)}... (${report._asset_name}) [type: ${report._slug}]`);
                    
                    // Consolidate all JSONB fields into report_data
                    // Different report types have different JSONB fields (report_info, visual_inspection_items, etc.)
                    const reportData: any = {};
                    Object.keys(report).forEach(key => {
                      // Skip metadata and standard fields
                      if (!['id', 'job_id', 'user_id', 'created_at', 'updated_at', '_source_table', '_asset_name', '_slug'].includes(key)) {
                        reportData[key] = report[key];
                      }
                    });
                    
                    // Flatten report_info into top level for desktop components
                    // The desktop reports expect flat fields like reportData.customer, not reportData.report_info.customer
                    if (reportData.report_info && typeof reportData.report_info === 'object') {
                      const reportInfo = reportData.report_info;
                      // Copy report_info fields to top level (don't overwrite existing fields)
                      Object.keys(reportInfo).forEach(key => {
                        if (reportData[key] === undefined) {
                          reportData[key] = reportInfo[key];
                        }
                      });
                      // Also keep the original report_info for backwards compatibility
                    }
                    
                    // Also flatten report_data if it exists (some tables use report_data instead of report_info)
                    if (reportData.report_data && typeof reportData.report_data === 'object') {
                      const nestedData = reportData.report_data;
                      Object.keys(nestedData).forEach(key => {
                        if (reportData[key] === undefined) {
                          reportData[key] = nestedData[key];
                        }
                      });
                    }
                    
                    // Map Supabase column names to desktop component field names
                    // Supabase uses snake_case, desktop uses camelCase with different structures
                    // Different report types use different column names for visual inspection!
                    
                    // Visual inspection mapping - check all possible column names
                    if (!reportData.visualInspectionItems) {
                      // Try visual_mechanical (switchgear, panelboard)
                      if (reportData.visual_mechanical?.items) {
                        reportData.visualInspectionItems = reportData.visual_mechanical.items;
                      }
                      // Try visual_inspection (transformers, circuit breakers)
                      else if (reportData.visual_inspection?.items) {
                        reportData.visualInspectionItems = reportData.visual_inspection.items;
                      }
                      // Try visual_inspection_items (some reports use this)
                      else if (reportData.visual_inspection_items) {
                        reportData.visualInspectionItems = Array.isArray(reportData.visual_inspection_items) 
                          ? reportData.visual_inspection_items 
                          : reportData.visual_inspection_items.items || [];
                      }
                      // Try visualMechanical (camelCase variant)
                      else if (reportData.visualMechanical?.items) {
                        reportData.visualInspectionItems = reportData.visualMechanical.items;
                      }
                    }
                    
                    // Insulation resistance mapping - check 'data' column first (web app stores full formData there)
                    if (reportData.data?.insulationResistance && !reportData.insulationResistance) {
                      reportData.insulationResistance = reportData.data.insulationResistance;
                    }
                    if (reportData.insulation_resistance?.tests && !reportData.insulationResistanceTests) {
                      reportData.insulationResistanceTests = reportData.insulation_resistance.tests;
                    }
                    if (reportData.insulation_resistance && !reportData.insulationResistance) {
                      reportData.insulationResistance = reportData.insulation_resistance;
                    }
                    
                    // Contact resistance mapping - check 'data' column first
                    if (reportData.data?.contactResistance && !reportData.contactResistance) {
                      reportData.contactResistance = reportData.data.contactResistance;
                    }
                    if (reportData.contact_resistance?.tests && !reportData.contactResistanceTests) {
                      reportData.contactResistanceTests = reportData.contact_resistance.tests;
                    }
                    if (reportData.contact_resistance && !reportData.contactResistance) {
                      reportData.contactResistance = reportData.contact_resistance;
                    }
                    
                    // Test equipment mapping - check all possible column names
                    if (!reportData.testEquipment) {
                      if (reportData.test_equipment_used) {
                        reportData.testEquipment = reportData.test_equipment_used;
                      }
                      else if (reportData.test_equipment) {
                        reportData.testEquipment = reportData.test_equipment;
                      }
                      // Also check inside report_info for testEquipment
                      else if (reportData.report_info?.testEquipment) {
                        reportData.testEquipment = reportData.report_info.testEquipment;
                      }
                    }
                    
                    // Nameplate data mapping (web app uses nameplateData, may be in 'data' column)
                    if (reportData.data?.nameplateData && !reportData.nameplateData) {
                      reportData.nameplateData = reportData.data.nameplateData;
                    }
                    if (reportData.nameplate_data && !reportData.nameplateData) {
                      reportData.nameplateData = reportData.nameplate_data;
                    }
                    if (reportData.nameplate && !reportData.nameplateData) {
                      reportData.nameplateData = reportData.nameplate;
                    }
                    
                    // Primary injection mapping (for circuit breaker reports)
                    if (reportData.primary_injection && !reportData.primaryInjection) {
                      reportData.primaryInjection = reportData.primary_injection;
                    }
                    
                    // Device settings mapping
                    if (reportData.device_settings && !reportData.deviceSettings) {
                      reportData.deviceSettings = reportData.device_settings;
                    }
                    
                    // Metal Enclosed Busway specific: flatten insulation_resistance.readings to insulationResistance
                    // The web app stores readings in insulation_resistance.readings with keys like aToB, bToC, etc.
                    if (reportData.insulation_resistance?.readings && !reportData.insulationResistance) {
                      const readings = reportData.insulation_resistance.readings;
                      reportData.insulationResistance = { ...readings };
                      // Also store the test voltage and TCF at top level
                      if (reportData.insulation_resistance.testVoltage) {
                        reportData.testVoltage = reportData.insulation_resistance.testVoltage;
                      }
                      if (reportData.insulation_resistance.tcf) {
                        reportData.tcf = reportData.insulation_resistance.tcf;
                      }
                    }
                    
                    // Also handle correctedReadings
                    if (reportData.insulation_resistance?.correctedReadings && !reportData.correctedInsulationResistance) {
                      reportData.correctedInsulationResistance = { ...reportData.insulation_resistance.correctedReadings };
                    }
                    
                    // VLF Cable Test specific: flatten 'data' column which contains full formData
                    // The web app stores the entire form in a 'data' JSONB column
                    if (reportData.data && typeof reportData.data === 'object') {
                      // Flatten all properties from data into reportData
                      Object.keys(reportData.data).forEach(key => {
                        if (!reportData[key]) {
                          reportData[key] = reportData.data[key];
                        }
                      });
                    }
                    
                    // Bus resistance mapping (Metal Enclosed Busway uses bus_resistance column)
                    if (reportData.bus_resistance && !reportData.busResistance) {
                      reportData.busResistance = reportData.bus_resistance;
                    }
                    
                    const localReport = {
                      id: report.id,
                      job_id: report.job_id,
                      title: report._asset_name || 'Report',
                      report_type: report._slug || 'unknown', // Use the slug as report_type so renderers can match it
                      status: 'draft', // Default status since source tables don't have status
                      report_data: JSON.stringify(reportData),
                      submitted_by: report.user_id || null,
                      submitted_at: null,
                      reviewed_by: null,
                      reviewed_at: null,
                      revision_history: '[]',
                      current_version: 1,
                      review_comments: null,
                      approved_at: null,
                      issued_at: null,
                      sent_at: null,
                      is_dirty: 0,
                      last_sync_at: new Date().toISOString(),
                      created_at: report.created_at,
                      updated_at: report.updated_at,
                    };
                    
                    try {
                      console.log(`     Inserting into local technical_reports table...`);
                      const result = await window.electronAPI.dbQuery('reports', 'upsertReport', localReport);
                      if (result.success) {
                        referencedReportsInserted++;
                        console.log(`     ✅ Successfully inserted`);
                      } else {
                        referencedReportsFailed++;
                        console.error(`     ❌ Failed: ${result.error}`);
                      }
                    } catch (err: any) {
                      referencedReportsFailed++;
                      console.error(`     ❌ Exception: ${err.message}`);
                    }
                  }
                  
                  console.log(`✅ Successfully synced ${referencedReportsInserted}/${referencedReports.length} reports from ${reportsByTable.size} different report tables`);
                  if (referencedReportsFailed > 0) {
                    console.error(`❌ Failed to sync ${referencedReportsFailed} reports`);
                  }
                  totalReports += referencedReportsInserted;
                }
              } else {
                console.log('ℹ️  No report references found in assets');
              }
            }
          
          // Now insert job_asset links (AFTER assets are inserted)
          console.log('\n🔗 Syncing job_asset links...');
          let linksInserted = 0;
          let linksFailed = 0;
          const linkFailureReasons: Record<string, number> = {};
          
          for (const link of jobAssetLinks) {
            try {
              const localLink = {
                id: link.id,
                job_id: link.job_id,
                asset_id: link.asset_id,
                user_id: link.user_id || null,
                created_at: link.created_at,
              };
              
              const result = await window.electronAPI.dbQuery('job_assets', 'upsertJobAsset', localLink);
              if (result.success) {
                linksInserted++;
              } else {
                linksFailed++;
                const errorMsg = result.error || 'Unknown error';
                linkFailureReasons[errorMsg] = (linkFailureReasons[errorMsg] || 0) + 1;
              }
            } catch (err: any) {
              linksFailed++;
              const errorMsg = err.message || 'Exception during insert';
              linkFailureReasons[errorMsg] = (linkFailureReasons[errorMsg] || 0) + 1;
            }
          }
          
          console.log(`✅ Successfully synced ${linksInserted}/${jobAssetLinks.length} job_asset links`);
          if (linksFailed > 0) {
            console.error(`❌ Failed to sync ${linksFailed} links`);
            console.error('Link failure reasons:', linkFailureReasons);
          }
        }
      }
    }
    
    console.log('\n=== Full Sync Complete ===');
    console.log(`📊 Summary:`);
    console.log(`  - ${templateResult.formTemplatesCount || 0} custom form templates (reusable forms)`);
    console.log(`  - ${jobResult.jobsCount} in-progress jobs (+ any parent jobs for referenced reports)`);
    console.log(`  - ${totalReports} filled-out reports`);
    console.log(`  - ${assetsInserted || 0} assets (PDFs, photos, drawings, and report references)`);
    console.log(`\nℹ️  Note: Syncs in-progress jobs plus any reports referenced by their assets.`);
    console.log(`Standard report types (ATS/MTS) are built into the app.`);
    
    return {
      success: true,
      jobsCount: jobResult.jobsCount,
      reportsCount: totalReports,
      formTemplatesCount: templateResult.formTemplatesCount || 0,
      assetsCount: assetsInserted || 0,
    };
  } catch (error: any) {
    console.error('Full sync failed:', error);
    return {
      success: false,
      error: error.message || 'Unknown error during full sync',
    };
  }
}

// ============================================================================
// SYNC UP - Upload local changes to Supabase
// ============================================================================

export interface SyncUpResult {
  success: boolean;
  reportsUploaded?: number;
  assetsCreated?: number;
  errors?: string[];
}

// Slug to table name mapping for uploading
const SLUG_TO_TABLE: Record<string, string> = {
  'switchgear-switchboard-assemblies-ats25': 'switchgear_switchboard_ats25_reports',
  'panelboard-assemblies-ats25': 'panelboard_assemblies_ats25_reports',
  'panelboard-report': 'panelboard_reports',
  'switchgear-report': 'switchgear_reports',
  'dry-type-transformer': 'transformer_reports',
  'large-dry-type-transformer-report': 'large_transformer_reports',
  'large-dry-type-transformer': 'large_transformer_reports',
  'large-dry-type-transformer-mts-report': 'large_dry_type_transformer_mts_reports',
  'large-dry-type-xfmr-mts-report': 'large_dry_type_transformer_mts_reports',
  'liquid-xfmr-visual-mts-report': 'liquid_xfmr_visual_mts_reports',
  'low-voltage-switch-report': 'low_voltage_switch_reports',
  'medium-voltage-switch-oil-report': 'medium_voltage_switch_oil_reports',
  'medium-voltage-switch-sf6': 'medium_voltage_switch_sf6_reports',
  'medium-voltage-switch-sf6-report': 'medium_voltage_switch_sf6_reports',
  'potential-transformer-ats-report': 'potential_transformer_ats_reports',
  'low-voltage-panelboard-small-breaker-report': 'low_voltage_panelboard_small_breaker_reports',
  'medium-voltage-circuit-breaker-report': 'medium_voltage_circuit_breaker_reports',
  'medium-voltage-circuit-breaker-mts-report': 'medium_voltage_circuit_breaker_mts_reports',
  'medium-voltage-vlf-mts-report': 'medium_voltage_vlf_mts_reports',
  'medium-voltage-cable-vlf-test-mts': 'medium_voltage_cable_vlf_test',
  'medium-voltage-vlf': 'medium_voltage_vlf_mts_reports',
  'medium-voltage-vlf-tan-delta': 'tandelta_reports',
  'medium-voltage-vlf-tan-delta-mts': 'tandelta_mts_reports',
  'electrical-tan-delta-test-mts-form': 'tandelta_mts_reports',
  'medium-voltage-cable-vlf-test': 'medium_voltage_cable_vlf_test',
  'current-transformer-test-ats-report': 'current_transformer_test_ats_reports',
  '12-current-transformer-test-ats-report': 'current_transformer_test_ats_reports',
  '12-current-transformer-test-mts-report': 'current_transformer_test_mts_reports',
  '13-voltage-potential-transformer-test-mts-report': 'voltage_potential_transformer_mts_reports',
  '23-medium-voltage-motor-starter-mts-report': 'medium_voltage_motor_starter_mts_reports',
  '23-medium-voltage-switch-mts-report': 'medium_voltage_switch_mts_reports',
  'metal-enclosed-busway': 'metal_enclosed_busway_reports',
  'low-voltage-circuit-breaker-thermal-magnetic-mts-report': 'low_voltage_circuit_breaker_thermal_magnetic_mts_reports',
  'low-voltage-circuit-breaker-electronic-trip-ats-report': 'low_voltage_circuit_breaker_electronic_trip_ats',
  'low-voltage-circuit-breaker-electronic-trip-ats-primary-injection': 'low_voltage_circuit_breaker_electronic_trip_ats',
  '8-low-voltage-circuit-breaker-electronic-trip-unit-ats-primary-injection': 'low_voltage_circuit_breaker_electronic_trip_ats',
  'low-voltage-circuit-breaker-electronic-trip-ats-secondary-injection-report': 'low_voltage_circuit_breaker_electronic_trip_ats',
  'low-voltage-circuit-breaker-thermal-magnetic-ats-report': 'low_voltage_circuit_breaker_thermal_magnetic_ats',
  'automatic-transfer-switch-ats-report': 'automatic_transfer_switch_ats_reports',
  'low-voltage-circuit-breaker-electronic-trip-mts-report': 'low_voltage_circuit_breaker_electronic_trip_mts',
  'two-small-dry-typer-xfmr-mts-report': 'two_small_dry_type_xfmr_mts_reports',
  'low-voltage-cable-test-3sets': 'low_voltage_cable_test_3sets',
  'low-voltage-cable-test-12sets': 'low_voltage_cable_test_12sets',
  'low-voltage-cable-test-20sets': 'low_voltage_cable_test_12sets', // Uses same table
  'low-voltage-switch-multi-device-test': 'low_voltage_switch_multi_device_reports',
  'two-small-dry-typer-xfmr-ats-report': 'two_small_dry_type_xfmr_ats_reports',
  'small-lv-dry-type-transformer-ats25': 'small_lv_dry_type_transformer_ats25_reports',
  'switchgear-panelboard-mts-report': 'switchgear_panelboard_mts_reports',
  'liquid-filled-transformer': 'liquid_filled_transformer_reports',
  'liquid-filled-xfmr-ats25': 'liquid_filled_xfmr_ats25_reports',
  'oil-inspection': 'liquid_filled_transformer_reports',
  '6-low-voltage-switch-maint-mts-report': 'low_voltage_switch_maint_mts_reports',
  'grounding-fall-of-potential-slope-method-test': 'grounding_fall_of_potential_slope_method_test_reports',
  'grounding-system-master': 'grounding_system_master_reports',
  // Additional LV Cable mappings
  '3-low-voltage-cable-ats': 'low_voltage_cable_test_12sets',
  '3-low-voltage-cable-mts': 'low_voltage_cable_test_3sets',
  // Oil Analysis
  'oil-analysis': 'oil_analysis_reports',
  // Relay Test
  'relay-test-report': 'relay_test_reports',
};

/**
 * Upload dirty reports from local SQLite to Supabase
 */
export async function syncUpReports(): Promise<SyncUpResult> {
  try {
    console.log('=== Starting Sync UP (Upload to Supabase) ===');
    const supabase = getSupabase();
    const errors: string[] = [];
    let reportsUploaded = 0;
    let assetsCreated = 0;
    
    // Get all dirty reports from local database
    console.log('📤 Querying for dirty reports...');
    let reportsResult;
    try {
      reportsResult = await window.electronAPI.dbQuery('reports', 'getDirty', {});
      console.log('📤 getDirty result:', reportsResult);
    } catch (dbErr: any) {
      console.error('❌ Database error getting dirty reports:', dbErr);
      return { success: false, errors: ['Database error: ' + dbErr.message] };
    }
    
    if (!reportsResult.success) {
      console.error('❌ Failed to get dirty reports:', reportsResult.error);
      return { success: false, errors: [reportsResult.error || 'Failed to query dirty reports'] };
    }
    
    const dirtyReports = reportsResult.data || [];
    console.log(`📤 Found ${dirtyReports.length} dirty reports to upload`);
    
    if (dirtyReports.length === 0) {
      console.log('ℹ️  No dirty reports to sync');
      return { success: true, reportsUploaded: 0, assetsCreated: 0 };
    }
    
    for (const report of dirtyReports) {
      try {
        console.log(`\n📝 Processing report: ${report.title} (${report.report_type})`);
        
        // Get the table name for this report type
        const tableName = SLUG_TO_TABLE[report.report_type];
        
        if (!tableName) {
          console.warn(`⚠️  Unknown report type: ${report.report_type}, skipping`);
          errors.push(`Unknown report type: ${report.report_type}`);
          continue;
        }
        
        // Parse report_data - might be double-stringified
        let reportData: any = {};
        try {
          let rawData = report.report_data;
          console.log(`  📄 Raw report_data type:`, typeof rawData);
          console.log(`  📄 Raw report_data preview:`, String(rawData).substring(0, 200));
          
          // Parse if string
          if (typeof rawData === 'string') {
            reportData = JSON.parse(rawData);
            // Check if it got double-stringified
            if (typeof reportData === 'string') {
              console.log(`  ⚠️ Double-stringified, parsing again...`);
              reportData = JSON.parse(reportData);
            }
          } else {
            reportData = rawData || {};
          }
          
          console.log(`  📄 Parsed reportData keys:`, Object.keys(reportData));
        } catch (e) {
          console.error('Failed to parse report_data:', e);
          errors.push(`Failed to parse report_data for ${report.id}`);
          continue;
        }
        
        // Build the payload for Supabase
        // Different tables have different column structures - use table-specific mapping
        const payload: any = {
          id: report.id,
          job_id: report.job_id,
          user_id: report.submitted_by || null,
          created_at: report.created_at,
          updated_at: new Date().toISOString(),
        };
        
        // TABLE-SPECIFIC COLUMN DEFINITIONS
        // Each table has different columns - we must only include columns that exist
        // VERIFIED FROM WEB APP handleSave functions - BE VERY CAREFUL HERE!
        const TABLE_COLUMNS: Record<string, string[]> = {
          // ============ Tables that use a SINGLE report_data column ============
          // These wrap ALL data inside a single report_data JSONB column
          'medium_voltage_circuit_breaker_reports': ['report_data'],
          'medium_voltage_circuit_breaker_mts_reports': ['report_data'],
          'liquid_xfmr_visual_mts_reports': ['report_data'],
          'two_small_dry_type_xfmr_ats_reports': ['report_data'],
          'two_small_dry_type_xfmr_mts_reports': ['report_data'],
          'current_transformer_test_mts_reports': ['report_data'],
          'voltage_potential_transformer_mts_reports': ['report_data'],
          'low_voltage_cable_test_3sets': ['report_data'],
          'low_voltage_cable_test_12sets': ['report_data'],
          
          // ============ Tables that use a SINGLE data column ============
          'medium_voltage_cable_vlf_test': ['data'],
          'medium_voltage_vlf_mts_reports': ['data'],
          'tandelta_reports': ['data'],
          'tandelta_mts_reports': ['data'],
          
          // ============ ATS25 Tables - Use SEPARATE columns ============
          // These have individual JSONB columns for each section
          'small_lv_dry_type_transformer_ats25_reports': ['report_info', 'visual_mechanical', 'insulation_resistance', 'turns_ratio', 'test_equipment', 'comments'],
          'liquid_filled_xfmr_ats25_reports': ['report_info', 'visual_mechanical', 'insulation_resistance', 'test_equipment', 'comments'],
          'switchgear_switchboard_ats25_reports': ['report_info', 'visual_mechanical', 'insulation_resistance', 'contact_resistance', 'test_equipment', 'comments'],
          'panelboard_assemblies_ats25_reports': ['report_info', 'visual_mechanical', 'insulation_resistance', 'contact_resistance', 'test_equipment', 'comments'],
          'potential_transformer_ats_reports': ['report_info', 'device_data', 'visual_inspection', 'fuse_data', 'fuse_resistance', 'insulation_resistance', 'insulation_corrected', 'turns_ratio', 'equipment_used', 'comments'],
          'current_transformer_test_ats_reports': ['report_info', 'device_data', 'visual_inspection', 'electrical_tests', 'test_equipment', 'comments'],
          
          // ============ MTS Tables that use report_info column ============
          // These use report_info as the primary data column (NOT report_data)
          'switchgear_panelboard_mts_reports': ['report_info'],
          'large_dry_type_transformer_mts_reports': ['report_info'],
          'oil_inspection_reports': ['report_info'],
          'medium_voltage_motor_starter_mts_reports': ['report_info'],
          'medium_voltage_switch_mts_reports': ['report_info'],
          'low_voltage_switch_maint_mts_reports': ['report_info'],
          'grounding_system_master_reports': ['report_info', 'rows'],
          'grounding_fall_of_potential_slope_method_test_reports': ['report_info', 'rows'],
          
          // ============ Other Tables ============
          'metal_enclosed_busway_reports': ['report_info', 'visual_inspection', 'insulation_resistance', 'contact_resistance', 'test_equipment', 'comments'],
          'automatic_transfer_switch_ats_reports': ['report_info', 'visual_inspection_items', 'insulation_resistance', 'contact_resistance', 'test_equipment_used', 'comments'],
          'low_voltage_panelboard_small_breaker_reports': ['report_info', 'visual_mechanical_inspection', 'electrical_tests', 'test_equipment', 'comments_text', 'status'],
          
          // ============ Low Voltage Circuit Breaker Tables ============
          'low_voltage_circuit_breaker_electronic_trip_ats': ['report_info', 'device_data', 'visual_inspection', 'electrical_tests', 'test_equipment', 'comments'],
          'low_voltage_circuit_breaker_electronic_trip_mts': ['report_info', 'device_data', 'visual_inspection', 'electrical_tests', 'test_equipment', 'comments'],
          'low_voltage_circuit_breaker_thermal_magnetic_ats': ['report_info', 'device_data', 'visual_inspection', 'electrical_tests', 'test_equipment', 'comments'],
          'low_voltage_circuit_breaker_thermal_magnetic_mts_reports': ['report_info', 'device_data', 'visual_inspection', 'electrical_tests', 'test_equipment', 'comments'],
        };
        
        // Get columns for this table, or use default (report_info for unknown tables)
        const tableColumns = TABLE_COLUMNS[tableName] || ['report_info'];
        console.log(`  📋 Table ${tableName} columns:`, tableColumns);
        
        // Build the payload based on table columns
        if (tableColumns.includes('report_data')) {
          // Tables that use a single report_data column
          payload.report_data = reportData;
        } else if (tableColumns.includes('data')) {
          // Tables that use a single data column
          payload.data = reportData;
        } else {
          // Tables that use report_info + optional specific columns
          
          // Always include report_info
          if (tableColumns.includes('report_info')) {
            if (reportData.report_info) {
              payload.report_info = reportData.report_info;
            } else {
              // Build report_info from top-level fields
              payload.report_info = {
                customer: reportData.customerName || reportData.customer,
                address: reportData.customerLocation || reportData.address,
                jobNumber: reportData.jobNumber,
                identifier: reportData.identifier,
                technicians: reportData.technicians,
                date: reportData.date,
                substation: reportData.substation,
                eqptLocation: reportData.eqptLocation,
                temperature: reportData.temperature,
                status: reportData.status,
                nameplate: reportData.nameplate || reportData.nameplate_data
              };
            }
          }
          
          // Visual inspection columns
          if (tableColumns.includes('visual_mechanical')) {
            payload.visual_mechanical = reportData.visual_mechanical || reportData.visualInspectionItems || 
                                        reportData.visual_inspection_items || { items: reportData.visualInspection };
          }
          if (tableColumns.includes('visual_inspection')) {
            payload.visual_inspection = reportData.visual_inspection || reportData.visualInspectionItems || 
                                        reportData.visual_inspection_items || reportData.visualInspection;
          }
          if (tableColumns.includes('visual_inspection_items')) {
            payload.visual_inspection_items = reportData.visual_inspection_items || reportData.visualInspectionItems || 
                                              reportData.visualInspection;
          }
          if (tableColumns.includes('visual_mechanical_inspection')) {
            payload.visual_mechanical_inspection = reportData.visual_mechanical_inspection || reportData.visualInspectionItems || 
                                                   reportData.visual_inspection_items;
          }
          
          // Insulation resistance
          if (tableColumns.includes('insulation_resistance')) {
            payload.insulation_resistance = reportData.insulation_resistance || reportData.insulationResistance || {
              rows: reportData.insulationRows,
              dielectricAbsorptionRatio: reportData.dielectricAbsorptionRatio
            };
          }
          
          // Contact resistance
          if (tableColumns.includes('contact_resistance')) {
            payload.contact_resistance = reportData.contact_resistance || reportData.contactResistance;
          }
          
          // Turns ratio
          if (tableColumns.includes('turns_ratio')) {
            payload.turns_ratio = reportData.turns_ratio || reportData.turnsRatio;
          }
          
          // Test equipment - different column names
          if (tableColumns.includes('test_equipment')) {
            payload.test_equipment = reportData.test_equipment || reportData.test_equipment_used || reportData.testEquipment;
          }
          if (tableColumns.includes('test_equipment_used')) {
            payload.test_equipment_used = reportData.test_equipment_used || reportData.test_equipment || reportData.testEquipment;
          }
          if (tableColumns.includes('equipment_used')) {
            payload.equipment_used = reportData.equipment_used || reportData.equipment || reportData.test_equipment_used || reportData.testEquipment;
          }
          
          // Device/transformer data
          if (tableColumns.includes('device_data')) {
            payload.device_data = reportData.device_data || reportData.ptData || reportData.ctData || reportData.deviceData;
          }
          if (tableColumns.includes('transformer_data')) {
            payload.transformer_data = reportData.transformer_data || reportData.ptData || reportData.deviceData;
          }
          
          // Electrical tests
          if (tableColumns.includes('electrical_tests')) {
            payload.electrical_tests = reportData.electrical_tests || reportData.electricalTests || {
              insulation: reportData.insulationResistance,
              contact: reportData.contactResistance
            };
          }
          
          // Fuse data
          if (tableColumns.includes('fuse_data')) {
            payload.fuse_data = reportData.fuse_data || reportData.fuseData;
          }
          if (tableColumns.includes('fuse_resistance')) {
            payload.fuse_resistance = reportData.fuse_resistance || reportData.fuseResistance;
          }
          
          // Insulation corrected
          if (tableColumns.includes('insulation_corrected')) {
            payload.insulation_corrected = reportData.insulation_corrected || reportData.insulationCorrected;
          }
          
          // Rows (for grounding reports)
          if (tableColumns.includes('rows')) {
            payload.rows = reportData.rows;
          }
          
          // Comments - different column names
          if (tableColumns.includes('comments')) {
            payload.comments = reportData.comments || '';
          }
          if (tableColumns.includes('comments_text')) {
            payload.comments_text = reportData.comments_text || reportData.comments || '';
          }
          
          // Status
          if (tableColumns.includes('status')) {
            payload.status = reportData.status || 'PENDING';
          }
        }
        
        // Log what we're saving to help debug
        console.log(`  📦 Payload keys:`, Object.keys(payload));
        console.log(`  📦 Report data keys:`, Object.keys(reportData));
        
        // Log actual DATA values to see if they have content
        for (const key of Object.keys(reportData)) {
          const val = reportData[key];
          const valStr = JSON.stringify(val);
          const isEmpty = !val || valStr === '{}' || valStr === '[]' || valStr === 'null';
          console.log(`  📦 reportData.${key}: ${isEmpty ? '⚠️ EMPTY' : `✓ has data (${valStr?.length} chars)`}`);
          if (!isEmpty && valStr?.length < 300) {
            console.log(`     → ${valStr}`);
          }
        }
        
        // Log payload values
        console.log(`\n  📦 PAYLOAD being built:`);
        for (const key of Object.keys(payload)) {
          const val = payload[key];
          const valStr = JSON.stringify(val);
          const isEmpty = !val || valStr === '{}' || valStr === '[]' || valStr === 'null';
          console.log(`  📦 payload.${key}: ${isEmpty ? '⚠️ EMPTY' : `✓ has data (${valStr?.length} chars)`}`);
          if (!isEmpty && valStr?.length < 300) {
            console.log(`     → ${valStr}`);
          }
        }
        
        console.log(`  📡 Upserting to ${tableName}...`);
        
        // Use upsert instead of checking existence - much simpler and faster
        let result;
        try {
          // Remove id and metadata - we only want to update data columns
          const { id, job_id, user_id, created_at, updated_at: ua, ...dataPayload } = payload;
          
          // Build update payload with ONLY columns that have REAL data (not empty objects/arrays)
          const updatePayload: any = {
            updated_at: new Date().toISOString()
          };
          
          // Helper to check if value has actual content
          const hasContent = (val: any): boolean => {
            if (val === undefined || val === null) return false;
            if (typeof val === 'string') return val.trim().length > 0;
            if (Array.isArray(val)) return val.length > 0;
            if (typeof val === 'object') {
              const keys = Object.keys(val);
              if (keys.length === 0) return false;
              // Check if any values in the object have content
              return keys.some(k => {
                const v = val[k];
                return v !== undefined && v !== null && v !== '';
              });
            }
            return true;
          };
          
          // Only include columns that actually have meaningful data
          for (const key of Object.keys(dataPayload)) {
            const value = dataPayload[key];
            if (hasContent(value)) {
              updatePayload[key] = value;
              console.log(`  ✓ Including ${key} (has content)`);
            } else {
              console.log(`  ⚠️ SKIPPING ${key} (empty/null)`);
            }
          }
          
          console.log(`  📦 Final update payload keys:`, Object.keys(updatePayload));
          
          // Check if we actually have data to send
          if (Object.keys(updatePayload).length <= 1) { // Only has updated_at
            console.error(`  ❌ No data columns to update! Report data might be empty.`);
            console.error(`  ❌ Original reportData keys:`, Object.keys(reportData));
            console.error(`  ❌ Original reportData:`, JSON.stringify(reportData, null, 2).substring(0, 1000));
            errors.push(`No data columns for ${report.id}`);
            continue;
          }
          
          // UPDATE the existing report
          console.log(`  📡 Sending UPDATE to ${tableName} for id ${report.id}...`);
          result = await supabase
            .schema('neta_ops')
            .from(tableName)
            .update(updatePayload)
            .eq('id', report.id)
            .select();
            
          console.log(`  📡 Result:`, result.error ? `Error: ${result.error.message}` : `Success - ${result.data?.length || 0} rows`);
          if (result.data && result.data.length > 0) {
            console.log(`  📡 Updated data from DB:`, JSON.stringify(result.data[0]).substring(0, 1000));
          }
        } catch (err: any) {
          console.error(`  ❌ Sync exception:`, err.message);
          errors.push(`Sync failed for ${report.id}: ${err.message}`);
          continue;
        }
        
        if (result?.error) {
          console.error(`  ❌ Failed to upsert report:`, result.error.message);
          errors.push(`Failed to upload ${report.id}: ${result.error.message}`);
          continue;
        }
        
        console.log(`  ✅ Report uploaded successfully`);
        reportsUploaded++;
        
        // Mark report as clean in local database
        await window.electronAPI.dbQuery('reports', 'markClean', { id: report.id });
        
      } catch (err: any) {
        console.error(`  ❌ Error processing report ${report.id}:`, err.message);
        errors.push(`Error processing ${report.id}: ${err.message}`);
      }
    }
    
    console.log('\n=== Sync UP Complete ===');
    console.log(`📊 Summary:`);
    console.log(`  - ${reportsUploaded} reports uploaded`);
    console.log(`  - ${assetsCreated} assets created`);
    if (errors.length > 0) {
      console.log(`  - ${errors.length} errors occurred`);
    }
    
    return {
      success: errors.length === 0,
      reportsUploaded,
      assetsCreated,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error: any) {
    console.error('Sync UP failed:', error);
    return {
      success: false,
      errors: [error.message || 'Unknown error during sync up']
    };
  }
}

