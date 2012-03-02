from django.conf.urls.defaults import patterns, include, url
from django.views.generic import TemplateView
from django.contrib.staticfiles.urls import staticfiles_urlpatterns


# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'discwar_ai.views.home', name='home'),
    # url(r'^discwar_ai/', include('discwar_ai.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    url(r'^discwar/aggressive$', 'discwar_ai.views.aggressive', name='game'),
    url(r'^discwar$', 'discwar_ai.views.loadGame')
)

urlpatterns += staticfiles_urlpatterns()
