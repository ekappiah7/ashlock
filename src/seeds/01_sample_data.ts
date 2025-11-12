/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Delete existing entries
  await knex('bookings').del();
  await knex('contacts').del();
  await knex('newsletter_subscribers').del();
  await knex('users').del();
  await knex('services').del();

  // Insert services
  await knex('services').insert([
    {
      name: 'Lock Installation',
      description: 'Professional installation of residential and commercial locks including deadbolts, smart locks, and security systems.',
      category: 'installation',
      base_price: 150.00,
      estimated_duration: 120,
      is_active: true,
      is_available_for_booking: true,
      requirements: JSON.stringify(['Access to installation location', 'Preference for lock type']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Lock Repair',
      description: 'Expert repair services for all types of locks including cylinders, mechanisms, and electronic components.',
      category: 'repair',
      base_price: 85.00,
      estimated_duration: 60,
      is_active: true,
      is_available_for_booking: true,
      requirements: JSON.stringify(['Broken lock component', 'Access to lock']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Lock Maintenance',
      description: 'Preventive maintenance services to keep your locks functioning properly and extend their lifespan.',
      category: 'maintenance',
      base_price: 65.00,
      estimated_duration: 45,
      is_active: true,
      is_available_for_booking: true,
      requirements: JSON.stringify(['Regular maintenance', 'Lock lubrication']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Emergency Lockout Service',
      description: '24/7 emergency service for lockouts, broken keys, and urgent security issues.',
      category: 'emergency',
      base_price: 120.00,
      estimated_duration: 90,
      is_active: true,
      is_available_for_booking: true,
      requirements: JSON.stringify(['Immediate service required', 'Proof of residence/ownership']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Smart Lock Installation',
      description: 'Installation and setup of smart locks with mobile app integration and remote access capabilities.',
      category: 'installation',
      base_price: 200.00,
      estimated_duration: 150,
      is_active: true,
      is_available_for_booking: true,
      requirements: JSON.stringify(['Wi-Fi network access', 'Smart device for setup']),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'Key Duplication',
      description: 'Professional key cutting and duplication services for residential, commercial, and automotive keys.',
      category: 'maintenance',
      base_price: 15.00,
      estimated_duration: 15,
      is_active: true,
      is_available_for_booking: true,
      requirements: JSON.stringify(['Original key for duplication']),
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  // Insert newsletter subscribers
  await knex('newsletter_subscribers').insert([
    {
      email: 'john.smith@email.com',
      is_active: true,
      subscribed_at: new Date('2024-01-15'),
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    {
      email: 'jane.doe@email.com',
      is_active: true,
      subscribed_at: new Date('2024-01-20'),
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    {
      email: 'mike.johnson@email.com',
      is_active: false,
      subscribed_at: new Date('2024-02-01'),
      unsubscribed_at: new Date('2024-02-15'),
      created_at: new Date('2024-02-01'),
      updated_at: new Date('2024-02-15')
    }
  ]);

  // Insert contacts
  await knex('contacts').insert([
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@email.com',
      phone: '+1-555-0123',
      subject: 'Smart Lock Installation Quote',
      message: 'Hi, I would like to get a quote for installing smart locks in my home. I have 4 exterior doors that need upgrading. Please let me know your availability this week.',
      status: 'new',
      priority: 'medium',
      created_at: new Date('2024-02-20'),
      updated_at: new Date('2024-02-20')
    },
    {
      name: 'David Brown',
      email: 'david.brown@email.com',
      phone: '+1-555-0456',
      subject: 'Emergency Lockout Service',
      message: 'I am locked out of my apartment and need immediate assistance. I have been waiting for 2 hours now. Please help as soon as possible.',
      status: 'resolved',
      priority: 'high',
      assigned_to: 'Mike Johnson',
      response: 'Emergency service was provided and customer was able to regain access. Issue resolved.',
      responded_at: new Date('2024-02-21'),
      created_at: new Date('2024-02-21'),
      updated_at: new Date('2024-02-21')
    },
    {
      name: 'Lisa Chen',
      email: 'lisa.chen@email.com',
      subject: 'Maintenance Service',
      message: 'I would like to schedule regular maintenance for my commercial locks. We have approximately 20 locks that need quarterly servicing.',
      status: 'in_progress',
      priority: 'medium',
      assigned_to: 'Alex Smith',
      created_at: new Date('2024-02-22'),
      updated_at: new Date('2024-02-22')
    }
  ]);
};