import { Service } from '../models/Service.js';

// 1. Public: Get all services
export const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ category: 1, price: 1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services' });
  }
};

// 2. Admin: Create a new service
export const createService = async (req, res) => {
  try {
    const { name, category, price, duration, description, popular } = req.body;
    if (!name || !price) {
      return res.status(400).json({ message: 'Service name and price are required' });
    }

    const service = await Service.create({
      name,
      category: category || 'Hair Styling',
      price,
      duration: duration || '30 mins',
      description: description || '',
      popular: Boolean(popular),
    });

    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create service: ' + error.message });
  }
};

// 3. Admin: Update a service
export const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const fields = ['name', 'category', 'price', 'duration', 'description', 'popular'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    const updated = await service.save();
    res.status(200).json({ message: 'Service updated successfully', service: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service' });
  }
};

// 4. Admin: Delete a service
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    await service.deleteOne();
    res.status(200).json({ message: 'Service removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete service' });
  }
};
