Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resources :products, only: %i[index show], param: :slug do
      get :availability, on: :member
    end
    resources :orders, only: :create

    namespace :admin do
      resources :days, only: %i[index update], param: :date
    end
  end
end
