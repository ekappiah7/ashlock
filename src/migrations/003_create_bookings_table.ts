/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('bookings', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('service_id').references('id').inTable('services').onDelete('RESTRICT');
    table.string('service').notNullable();
    table.enu('service_type', ['lock_installation', 'lock_repair', 'lock_maintenance', 'emergency_service']).notNullable();
    table.date('booking_date').notNullable();
    table.time('booking_time').notNullable();
    table.integer('duration').notNullable().defaultTo(60).comment('Duration in minutes');
    table.enu('status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).notNullable().defaultTo('pending');
    table.enu('priority', ['low', 'medium', 'high', 'emergency']).notNullable().defaultTo('medium');
    table.string('customer_name').notNullable();
    table.string('customer_phone').notNullable();
    table.string('customer_email').notNullable();
    table.text('service_address').notNullable();
    table.text('service_description');
    table.text('special_instructions');
    table.decimal('estimated_cost', 10, 2);
    table.decimal('actual_cost', 10, 2);
    table.string('assigned_technician');
    table.text('notes');
    table.timestamp('confirmed_at');
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamps(true, true);
    
    table.index(['user_id']);
    table.index(['service_id']);
    table.index(['booking_date']);
    table.index(['status']);
    table.index(['service_type']);
    table.index(['customer_email']);
    table.index(['assigned_technician']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bookings');
};