import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Hotel, Users, DollarSign, MapPin } from 'lucide-react';

export default function TestF1ScenarioPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">F1 Hotel Scenario Test</h1>
        <p className="text-gray-600">
          Demonstrating how the current schema handles fixed-date tours with shoulder nights
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenario Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              F1 Abu Dhabi 2024 - Hotel Block
            </CardTitle>
            <CardDescription>
              Fixed-date tour with shoulder nights - perfect example for our schema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Main Dates</h4>
                <Badge variant="default">Dec 4-8, 2024</Badge>
                <p className="text-sm text-gray-600 mt-1">5 nights</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Capacity</h4>
                <Badge variant="outline">100 rooms</Badge>
                <p className="text-sm text-gray-600 mt-1">Standard Double</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Rate Plans</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Main Package Rate</span>
                  <Badge variant="default">£150/night</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Pre-Night Add-on</span>
                  <Badge variant="secondary">£110/night</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Post-Night Add-on</span>
                  <Badge variant="secondary">£120/night</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schema Mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="w-5 h-5" />
              Schema Implementation
            </CardTitle>
            <CardDescription>
              How this scenario maps to our current database schema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Database Tables Used</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">inventory_pools</Badge>
                  <span className="text-sm">Shared 100-room pool</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">rate_plans</Badge>
                  <span className="text-sm">3 rate plans (main + 2 extras)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">allocation_buckets</Badge>
                  <span className="text-sm">Single bucket for all dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">rate_seasons</Badge>
                  <span className="text-sm">Date ranges for each rate plan</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Key Benefits</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>✅ Shared inventory across all rate plans</li>
                <li>✅ Different pricing for different periods</li>
                <li>✅ Single allocation bucket for simplicity</li>
                <li>✅ Flexible booking combinations</li>
                <li>✅ Easy to manage and understand</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Example Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Example Booking Scenarios
          </CardTitle>
          <CardDescription>
            How customers can book different combinations using the same inventory pool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Standard Package</h4>
              <p className="text-sm text-gray-600 mb-2">Dec 4-8 (5 nights)</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total:</span>
                <Badge variant="default">£750</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">Uses main rate plan only</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Extended Package</h4>
              <p className="text-sm text-gray-600 mb-2">Dec 3-9 (7 nights)</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total:</span>
                <Badge variant="default">£970</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">Pre + Main + Post rates</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Short Package</h4>
              <p className="text-sm text-gray-600 mb-2">Dec 4-6 (3 nights)</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total:</span>
                <Badge variant="default">£450</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">Partial main rate plan</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            How to Test This Scenario
          </CardTitle>
          <CardDescription>
            Steps to create and test the F1 hotel scenario in the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. Create Product</h4>
              <p className="text-sm text-gray-600">
                Go to Products → Create new product: "F1 Abu Dhabi 2024 Hotel Package"
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">2. Use Multi-Rate Wizard</h4>
              <p className="text-sm text-gray-600">
                Click "Add Multi-Rate Variant" button and configure:
              </p>
              <ul className="text-sm text-gray-600 mt-2 ml-4 space-y-1">
                <li>• Variant: "Standard Double Room"</li>
                <li>• Supplier: "Hotel Metropole"</li>
                <li>• Inventory Pool: "F1 2024 - Hotel Metropole" (100 rooms)</li>
                <li>• Main Rate: Dec 4-8, £150/night, 60% markup</li>
                <li>• Pre-Night: Dec 3, £110/night, 30% markup</li>
                <li>• Post-Night: Dec 9, £120/night, 30% markup</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Verify Schema</h4>
              <p className="text-sm text-gray-600">
                Check that the system created:
              </p>
              <ul className="text-sm text-gray-600 mt-2 ml-4 space-y-1">
                <li>• 1 inventory pool with 100 rooms</li>
                <li>• 3 rate plans with different pricing</li>
                <li>• 1 allocation bucket covering all dates</li>
                <li>• Rate seasons for each date range</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-4">
        <a 
          href="/products" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Go to Products
        </a>
        <a 
          href="/products/variants/simple-wizard" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Hotel className="w-4 h-4" />
          Test Simple Wizard
        </a>
      </div>
    </div>
  );
}
